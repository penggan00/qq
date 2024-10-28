require('dotenv').config();
const { Telegraf } = require('telegraf');
const tencentcloud = require("tencentcloud-sdk-nodejs");

const TmtClient = tencentcloud.tmt.v20180321.Client;
const OcrClient = tencentcloud.ocr.v20181119.Client;

// 创建 tmt 和 ocr 客户端
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
const ocrClient = new OcrClient(clientConfig);

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const bot = new Telegraf(botToken);

const allowedUserId = parseInt(process.env.ALLOWED_USER_ID);

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

// 图片文字识别
async function recognizeText(imageUrl) {
    const params = { ImageUrl: imageUrl };

    try {
        const response = await ocrClient.GeneralBasicOCR(params);
        return response?.TextDetections?.map(item => item.DetectedText).join(' ') || null;
    } catch (error) {
        console.error('识别错误：', error);
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
    const sourceLang = isAllChinese ? 'zh' : 'auto';
    const targetLang = isAllChinese ? 'en' : 'zh';

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

// 处理图片消息
bot.on('photo', async (ctx) => {
    if (ctx.message.from.id !== allowedUserId) {
        return ctx.reply('对不起，你没有权限使用此机器人。');
    }

    const photoId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
    try {
        const fileUrl = await ctx.telegram.getFileLink(photoId);
        const recognizedText = await recognizeText(fileUrl);

        if (recognizedText) {
            const isAllChinese = /^[\u4e00-\u9fa5\s]+$/.test(recognizedText);
            const sourceLang = isAllChinese ? 'zh' : 'auto';
            const targetLang = isAllChinese ? 'en' : 'zh';

            const translatedText = await translateText(recognizedText, sourceLang, targetLang);
            if (translatedText) {
                const messages = splitMessage(translatedText);
                for (const msg of messages) {
                    await ctx.reply(msg);
                }
            } else {
                ctx.reply('翻译失败，请稍后再试。');
            }
        } else {
            ctx.reply('识别文本失败，请稍后再试。');
        }
    } catch (error) {
        console.error('获取图片链接错误：', error);
        ctx.reply('无法处理图片，请稍后再试。');
    }
});

// 拒绝视频文件
bot.on('video', (ctx) => {
    ctx.reply('抱歉，我不处理视频文件。');
});

bot.launch();
