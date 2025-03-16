require('dotenv').config();
const { Telegraf } = require('telegraf');
const tencentcloud = require("tencentcloud-sdk-nodejs");

// 初始化腾讯云客户端
const tmtClient = new tencentcloud.tmt.v20180321.Client({
    credential: {
        secretId: process.env.TENCENT_SECRET_ID,
        secretKey: process.env.TENCENT_SECRET_KEY,
    },
    region: process.env.TENCENT_REGION || "ap-na-siliconvalley",
    profile: {
        signMethod: "TC3-HMAC-SHA256",
        httpProfile: {
            reqMethod: "POST",
            reqTimeout: 30,
        },
    },
});

const bot = new Telegraf(process.env.TELEGRAM_API_KEY);

// 环境变量校验
[ 'TELEGRAM_API_KEY', 'TENCENT_SECRET_ID', 'TENCENT_SECRET_KEY', 'TELEGRAM_CHAT_ID' ].forEach(varName => {
    if (!process.env[varName]) {
        console.error(`缺少必要环境变量: ${varName}`);
        process.exit(1);
    }
});

// 语言检测逻辑
function analyzeText(text) {
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const totalChars = text.replace(/[\s]/g, '').length;
    
    return {
        chineseRatio: totalChars > 0 ? chineseChars / totalChars : 0,
        hasLetters: /[a-zA-Z]/.test(text)
    };
}

// 智能分割消息
function splitMessage(text) {
    const MAX_LENGTH = 4096;
    const splitRegex = /[\n。！？]/; // 优先在自然断句处分割
    
    if (text.length <= MAX_LENGTH) return [text];
    
    const splitIndex = text.lastIndexOf(splitRegex, MAX_LENGTH);
    const firstChunk = text.substring(0, splitIndex !== -1 ? splitIndex + 1 : MAX_LENGTH);
    const remaining = text.substring(firstChunk.length);
    
    return [firstChunk, ...splitMessage(remaining)];
}

// 直接翻译函数
async function translateText(text, source, target) {
    try {
        const params = {
            SourceText: text,
            Source: source,
            Target: target,
            ProjectId: 1323297
        };

        const { TargetText } = await tmtClient.TextTranslate(params);
        return TargetText;
    } catch (error) {
        console.error('翻译失败:', error);
        throw new Error('翻译服务暂不可用');
    }
}

// 消息处理
bot.on('text', async ctx => {
    try {
        // 权限验证
        if (ctx.message.from.id !== parseInt(process.env.TELEGRAM_CHAT_ID)) {
            return ctx.reply('⛔ 未经授权的访问');
        }

        const text = ctx.message.text;
        
        // 语言检测
        const { chineseRatio } = analyzeText(text);
        
        // 确定翻译方向
        const { source, target } = chineseRatio > 0.7 
            ? { source: 'zh', target: 'en' }
            : { source: 'auto', target: 'zh' };

        // 执行翻译
        const translated = await translateText(text, source, target);
        
        // 分片发送
        const messages = splitMessage(translated);
        for (const msg of messages) {
            await ctx.reply(msg);
        }
        
    } catch (error) {
        console.error('处理错误:', error);
        await ctx.reply(`❌ 错误：${error.message}`);
    }
});

// 启动机器人
bot.launch().then(() => {
    console.log('机器人已启动');
}).catch(error => {
    console.error('启动失败:', error);
});

// 错误处理
process.on('uncaughtException', error => {
    console.error('未捕获异常:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('未处理的 Promise 拒绝:', promise, '原因:', reason);
});
