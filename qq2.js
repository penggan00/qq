require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const tencentcloud = require('tencentcloud-sdk-nodejs');

const TELEGRAM_API_KEY = process.env.TELEGRAM_API_KEY;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const TENCENT_SECRET_ID = process.env.TENCENT_SECRET_ID;
const TENCENT_SECRET_KEY = process.env.TENCENT_SECRET_KEY;
const TENCENT_REGION = process.env.TENCENT_REGION;

const bot = new TelegramBot(TELEGRAM_API_KEY, { polling: true });

// 配置腾讯云 SDK 客户端
const TmtClient = tencentcloud.tmt.v20180321.Client;
const clientConfig = {
  credential: {
    secretId: TENCENT_SECRET_ID,
    secretKey: TENCENT_SECRET_KEY,
  },
  region: TENCENT_REGION,
  profile: {
    httpProfile: {
      endpoint: 'tmt.tencentcloudapi.com',
    },
  },
};
const client = new TmtClient(clientConfig);

// 使用 SDK 实现翻译功能
const translateText = async (text, sourceLang, targetLang) => {
  const params = {
    SourceText: text,
    Source: sourceLang,
    Target: targetLang,
    ProjectId: 0
  };

  try {
    const response = await client.TextTranslate(params);
    console.log('API response:', response);
    return response.TargetText || 'Translation returned empty text.';
  } catch (error) {
    console.error('Translation error:', error);
    return 'Translation failed due to an error.';
  }
};

// 监听消息并进行翻译和发送
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text) return;

  let sourceLang = 'auto';
  let targetLang = 'zh';
  
  if (/[\u4e00-\u9fa5]/.test(text)) {
    // 中文翻译为英文
    targetLang = 'en';
  } else {
    // 其他语言翻译为中文
    targetLang = 'zh';
  }

  try {
    const translatedText = await translateText(text, sourceLang, targetLang);

    // 添加检查，确保 translatedText 是字符串且定义
    if (!translatedText || typeof translatedText !== 'string') {
      await bot.sendMessage(chatId, 'Translation failed or returned empty text.');
      return;
    }

    if (translatedText.length > 4096) {
      for (let i = 0; i < translatedText.length; i += 4096) {
        const chunk = translatedText.substring(i, i + 4096);
        await bot.sendMessage(chatId, chunk);
      }
    } else {
      await bot.sendMessage(chatId, translatedText);
    }
  } catch (error) {
    console.error('Error sending message:', error);
  }
});
