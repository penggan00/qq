import os
import re
import sqlite3
import time
from datetime import datetime, timedelta
from typing import List, Optional, Tuple
from dotenv import load_dotenv
from tencentcloud.common import credential
from tencentcloud.common.profile.client_profile import ClientProfile
from tencentcloud.common.profile.http_profile import HttpProfile
from tencentcloud.tmt.v20180321 import tmt_client, models
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

# ==================== 初始化配置 ====================
load_dotenv()

class Config:
    def __init__(self):
        # 必填配置验证
        self.TELEGRAM_TOKEN = self._get_env('TELEGRAM_API_KEY')
        self.AUTHORIZED_CHAT_IDS = self._parse_chat_ids('TELEGRAM_CHAT_ID')
        self.TENCENT_SECRET_ID = self._get_env('TENCENT_SECRET_ID')
        self.TENCENT_SECRET_KEY = self._get_env('TENCENT_SECRET_KEY')
        
        # 可选配置（带默认值）
        self.TENCENT_REGION = os.getenv('TENCENT_REGION', 'na-siliconvalley')
        self.TENCENT_PROJECT_ID = int(os.getenv('TENCENT_PROJECT_ID', '1323297'))

    def _get_env(self, var_name: str) -> str:
        """获取必须的环境变量"""
        value = os.getenv(var_name)
        if not value:
            raise ValueError(f"Missing required environment variable: {var_name}")
        return value

    def _parse_chat_ids(self, var_name: str) -> List[int]:
        """解析多个Chat ID（支持逗号分隔）"""
        ids_str = self._get_env(var_name)
        try:
            return [int(id_str.strip()) for id_str in ids_str.split(',')]
        except ValueError:
            raise ValueError(f"Invalid {var_name} format. Expected comma-separated integers")

config = Config()

# ==================== SQLite缓存系统 ====================
class TranslationCache:
    def __init__(self, db_path: str = 'translations.db'):
        self.conn = sqlite3.connect(db_path)
        self._init_db()
    
    def _init_db(self) -> None:
        """初始化数据库表"""
        with self.conn:
            self.conn.execute('''
                CREATE TABLE IF NOT EXISTS translations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    source_text TEXT NOT NULL,
                    source_lang TEXT NOT NULL,
                    target_lang TEXT NOT NULL,
                    translated_text TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(source_text, source_lang, target_lang)
                )
            ''')
            self.conn.execute('''
                CREATE INDEX IF NOT EXISTS idx_translations_key 
                ON translations(source_text, source_lang, target_lang)
            ''')
    
    def get(self, source_text: str, source_lang: str, target_lang: str) -> Optional[str]:
        """获取缓存翻译"""
        cursor = self.conn.execute('''
            SELECT translated_text FROM translations 
            WHERE source_text=? AND source_lang=? AND target_lang=?
        ''', (source_text, source_lang, target_lang))
        result = cursor.fetchone()
        return result[0] if result else None
    
    def set(self, source_text: str, source_lang: str, target_lang: str, translated_text: str) -> bool:
        """设置缓存翻译"""
        try:
            with self.conn:
                self.conn.execute('''
                    INSERT OR REPLACE INTO translations 
                    (source_text, source_lang, target_lang, translated_text) 
                    VALUES (?, ?, ?, ?)
                ''', (source_text, source_lang, target_lang, translated_text))
            return True
        except sqlite3.Error as e:
            print(f'[Cache Error] Failed to set cache: {e}')
            return False
    
    def clear_old_entries(self, days: int = 30) -> int:
        """清理过期缓存"""
        try:
            with self.conn:
                cursor = self.conn.execute('''
                    DELETE FROM translations 
                    WHERE created_at < datetime('now', ?)
                ''', (f'-{days} days',))
                return cursor.rowcount
        except sqlite3.Error as e:
            print(f'[Cache Error] Cleanup failed: {e}')
            return 0

cache = TranslationCache()

# ==================== 语言检测 ====================
def detect_language(text: str) -> str:
    """检测文本主导语言"""
    if not text or not isinstance(text, str):
        return 'unknown'
    
    # 清洗文本（保留汉字、字母、数字）
    clean_text = re.sub(r'[^\w\u4e00-\u9fff]', '', text, flags=re.UNICODE)
    if not clean_text:
        return 'unknown'
    
    # 字符类型统计
    char_stats = {
        'zh': len(re.findall(r'[\u4e00-\u9fff]', clean_text)),  # 中文
        'ja': len(re.findall(r'[\u3040-\u30ff\u31f0-\u31ff]', clean_text)),  # 日文
        'ko': len(re.findall(r'[\uac00-\ud7af\u1100-\u11ff]', clean_text)),  # 韩文
        'ru': len(re.findall(r'[\u0400-\u04FF]', clean_text)),  # 俄文
        'en': len(re.findall(r'[a-zA-Z]', clean_text)),  # 英文
    }
    
    # 计算比例并确定主导语言
    dominant_lang, dominant_ratio = max(
        ((lang, count / len(clean_text)) for lang, count in char_stats.items()),
        key=lambda x: x[1]
    )
    
    return dominant_lang if dominant_ratio > 0.4 else 'other'

def get_translation_direction(text: str) -> Tuple[str, str]:
    """确定翻译方向"""
    lang = detect_language(text)
    return ('auto', 'zh') if lang != 'zh' else ('zh', 'en')

# ==================== 腾讯云翻译服务 ====================
class TencentTranslator:
    def __init__(self):
        cred = credential.Credential(
            config.TENCENT_SECRET_ID,
            config.TENCENT_SECRET_KEY
        )
        
        http_profile = HttpProfile()
        http_profile.reqMethod = "POST"
        http_profile.reqTimeout = 30
        
        client_profile = ClientProfile()
        client_profile.httpProfile = http_profile
        client_profile.signMethod = "TC3-HMAC-SHA256"
        
        self.client = tmt_client.TmtClient(
            cred, 
            config.TENCENT_REGION, 
            client_profile
        )
    
    async def translate(
        self,
        text: str,
        source_lang: str,
        target_lang: str,
        max_retries: int = 3
    ) -> str:
        """带重试机制的翻译"""
        last_error = None
        for attempt in range(1, max_retries + 1):
            try:
                req = models.TextTranslateRequest()
                req.SourceText = text
                req.Source = source_lang
                req.Target = target_lang
                req.ProjectId = config.TENCENT_PROJECT_ID
                
                resp = self.client.TextTranslate(req)
                return resp.TargetText
            
            except Exception as e:
                last_error = e
                if attempt < max_retries:
                    wait_time = min(2 ** attempt, 5)  # 指数退避
                    print(f'[Retry {attempt}/{max_retries}] Waiting {wait_time}s...')
                    time.sleep(wait_time)
        
        raise last_error if last_error else Exception("Unknown translation error")

translator = TencentTranslator()

# ==================== 消息处理 ====================
async def translate_message(
    text: str,
    update: Update,
    context: ContextTypes.DEFAULT_TYPE
) -> None:
    """处理翻译流程"""
    # 1. 确定翻译方向
    source_lang, target_lang = get_translation_direction(text)
    
    # 2. 检查缓存
    cached = cache.get(text, source_lang, target_lang)
    if cached:
        await update.message.reply_text(
            f"📚 缓存翻译:\n{cached}",
            reply_to_message_id=update.message.message_id
        )
        return
    
    # 3. 发送处理中状态
    processing_msg = await update.message.reply_text(
        "🔄 正在翻译...",
        reply_to_message_id=update.message.message_id
    )
    
    try:
        # 4. 执行翻译
        translated = await translator.translate(text, source_lang, target_lang)
        
        # 5. 缓存结果
        cache.set(text, source_lang, target_lang, translated)
        
        # 6. 分片发送结果（Telegram消息长度限制为4096字符）
        chunk_size = 4000
        chunks = [translated[i:i+chunk_size] for i in range(0, len(translated), chunk_size)]
        
        for chunk in chunks:
            await update.message.reply_text(
                chunk,
                reply_to_message_id=update.message.message_id
            )
    
    except Exception as e:
        error_msg = str(e)
        if "LimitExceeded" in error_msg:
            error_msg = "API调用限额已用完，请1小时后再试"
        elif "InvalidParameter" in error_msg:
            error_msg = "无效的请求参数"
        
        await update.message.reply_text(
            f"❌ 翻译失败: {error_msg}",
            reply_to_message_id=update.message.message_id
        )
    
    finally:
        # 7. 清理处理中消息
        try:
            await context.bot.delete_message(
                chat_id=processing_msg.chat_id,
                message_id=processing_msg.message_id
            )
        except Exception:
            pass

# ==================== Telegram命令处理 ====================
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """欢迎命令"""
    await update.message.reply_text(
        "🤖 腾讯云翻译机器人\n\n"
        "直接发送文本即可自动翻译\n"
        "支持中英互译自动检测\n\n"
        f"授权用户ID: {', '.join(map(str, config.AUTHORIZED_CHAT_IDS))}"
    )

async def stats(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """统计信息"""
    cache_count = cache.conn.execute("SELECT COUNT(*) FROM translations").fetchone()[0]
    await update.message.reply_text(
        f"📊 系统统计:\n"
        f"- 缓存条目: {cache_count}\n"
        f"- 服务区域: {config.TENCENT_REGION}\n"
        f"- 项目ID: {config.TENCENT_PROJECT_ID}"
    )

async def handle_text(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """处理文本消息"""
    # 权限验证
    if update.message.chat.id not in config.AUTHORIZED_CHAT_IDS:
        await update.message.reply_text("⛔ 未授权的访问")
        return
    
    # 长度限制
    if len(update.message.text) > 5000:
        await update.message.reply_text("❌ 文本过长 (最大支持5000字符)")
        return
    
    await translate_message(update.message.text, update, context)

# ==================== 主程序 ====================
def main() -> None:
    # 创建机器人应用
    app = Application.builder().token(config.TELEGRAM_TOKEN).build()
    
    # 注册处理器
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("stats", stats))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))
    
    # 启动机器人
    print(f"🚀 机器人启动成功 | 授权ID: {config.AUTHORIZED_CHAT_IDS}")
    app.run_polling()

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"💥 致命错误: {str(e)}")
        exit(1)