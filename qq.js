(async () => {
    require('dotenv').config();
    const { Telegraf } = require('telegraf');
    const tencentcloud = require("tencentcloud-sdk-nodejs");

    const TmtClient = tencentcloud.tmt.v20180321.Client;
    const pLimit = (await import('p-limit')).default;  // 使用动态导入并提取 `default`

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

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const bot = new Telegraf(botToken);

    const allowedUserId = parseInt(process.env.ALLOWED_USER_ID);
    const limit = pLimit(3); // 限制并发数为3

    // 带重试机制的文本翻译
    async function translateText(text, sourceLang, targetLang, retries = 3) {
        const params = {
            SourceText: text,
            Source: sourceLang,
            Target: targetLang,
            ProjectId: 1323297
        };

        while (retries > 0) {
            try {
                const response = await tmtClient.TextTranslate(params);
                return response?.TargetText || null;
            } catch (error) {
                console.error('翻译错误：', error);
                retries--;
                if (retries === 0) return null;
            }
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
    bot.on('text', (ctx) => {
        if (ctx.message.from.id !== allowedUserId) {
            return ctx.reply('对不起，你没有权限使用此机器人。');
        }

        limit(() => processTextMessage(ctx));
    });

    async function processTextMessage(ctx) {
        const text = ctx.message.text;
        const isAllChinese = /^[\u4e00-\u9fa5\s]+$/.test(text);
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
    }

    // 处理图片和视频消息反馈
    bot.on(['photo', 'video'], (ctx) => {
        ctx.reply('抱歉，我不处理图片或视频文件。请发送文本消息以获取翻译服务。');
    });

    bot.launch();
})();
