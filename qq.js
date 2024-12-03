require('dotenv').config();
const { Telegraf } = require('telegraf');
const tencentcloud = require("tencentcloud-sdk-nodejs");

const TmtClient = tencentcloud.tmt.v20180321.Client;

// 创建 tmt 客户端
const clientConfig = {
    credential: {
        secretId: process.env.TENCENT_SECRET_ID,
        secretKey: process.env.TENCENT_SECRET_KEY,
    },
    region: process.env.TENCENT_REGION,
    profile: {
        signMethod: "TC3-HMAC-SHA256",
        httpProfile: {
            reqMethod: "POST",
            reqTimeout: 30,
        },
    },
};

const tmtClient = new TmtClient(clientConfig);

const botToken = process.env.TELEGRAM_API_KEY;
const bot = new Telegraf(botToken);

const allowedUserId = parseInt(process.env.TELEGRAM_CHAT_ID);

// 文本翻译
async function translateText(text, sourceLang, targetLang) {
    const params = {
        SourceText: text,
        Source: sourceLang,
        Target: targetLang,
        ProjectId: 1323297
    };

    try {
        const response = await tmtClient.TextTranslate(params);
        return response?.TargetText || null;
    } catch (error) {
        console.error('翻译错误：', error);
        return null;
    }
}

function splitMessage(text) {
    const maxLength = 4096;
    const messages = [];
    while (text.length > 0) {
        messages.push(text.substring(0, maxLength));
        text = text.substring(maxLength);
    }
    return messages;
}

// 处理文本消息
bot.on('text', async (ctx) => {
    if (ctx.message.from.id !== allowedUserId) {
        return ctx.reply('对不起，你没有权限使用此机器人。');
    }

    const text = ctx.message.text;
    const isAllChinese = /^[\u4e00-\u9fa5\s]+$/.test(text);
    const containsChinese = /[\u4e00-\u9fa5]/.test(text);

    let sourceLang, targetLang;

    if (isAllChinese) {
        // 如果是全中文，翻译成英文
        sourceLang = 'zh';
        targetLang = 'en';
    } else if (containsChinese) {
        // 如果包含中文，翻译成中文
        sourceLang = 'auto';
        targetLang = 'zh';
    } else {
        // 如果不包含中文，翻译成中文
        sourceLang = 'auto';
        targetLang = 'zh';
    }

    const translatedText = await translateText(text, sourceLang, targetLang);

    if (translatedText) {
        const messages = splitMessage(translatedText);
        for (const msg of messages) {
            await ctx.reply(msg);
        }
    } else {
        ctx.reply('翻译失败，请稍后再试。');
    }
});

bot.launch();
