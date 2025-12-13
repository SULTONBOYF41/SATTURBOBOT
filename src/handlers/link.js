const { BUTTON_LINK, BUTTON_RULES } = require('../keyboards/mainKeyboard');
const {
    CLOSED_CHANNEL_ID,
    CLOSED_GROUP_ID,
} = require('../config');
const {
    getUserByTelegramId,
    setVipAccessFlag,
} = require('../services/userService');

function registerLinkHandler(bot) {
    // /link komandasi
    bot.command('link', async (ctx) => {
        await sendVipLinks(ctx);
    });

    // Tugma orqali
    bot.hears(BUTTON_LINK, async (ctx) => {
        await sendVipLinks(ctx);
    });

    // Qoidalar tugmasi
    bot.hears(BUTTON_RULES, async (ctx) => {
        await sendRules(ctx);
    });
}

async function sendVipLinks(ctx) {
    try {
        const user = await getUserByTelegramId(ctx.from.id);
        if (!user) {
            return ctx.reply('Avval /start ni bosing.');
        }

        if (user.points < 3) {
            const need = 3 - user.points;
            return ctx.reply(
                `❌ Sizda yetarli ball yo'q.\n` +
                `Hozirgi ballaringiz: ${user.points}\n` +
                `Yana kamida ${need} ball yig'ishingiz kerak.`
            );
        }

        let msg = '';

        if (CLOSED_GROUP_ID) {
            const groupLink = await ctx.telegram.createChatInviteLink(
                CLOSED_GROUP_ID,
                { member_limit: 1 }
            );
            msg += `👥 Maxsus guruhga kirish linki:\n${groupLink.invite_link}\n\n`;
        }

        if (CLOSED_CHANNEL_ID) {
            const channelLink = await ctx.telegram.createChatInviteLink(
                CLOSED_CHANNEL_ID,
                { member_limit: 1 }
            );
            msg += `📢 Maxsus kanalgа kirish linki:\n${channelLink.invite_link}\n\n`;
        }

        if (!msg) {
            return ctx.reply(
                'Admin VIP kanal/guruh ID larini sozlamagan. Iltimos, admin bilan bog‘laning.'
            );
        }

        await setVipAccessFlag(user.telegram_id, 1);

        msg +=
            `ℹ️ Bu link(lar) bir martalik.\n` +
            `Keyinchalik ballaringiz 3 dan tushib ketsa, bot sizni VIP kanal va guruhdan chiqaradi.\n` +
            `Yana 3+ ball yig'sangiz, yana shu tugma orqali yangi link olishingiz mumkin.`;

        return ctx.reply(msg);
    } catch (e) {
        console.error('sendVipLinks error:', e);
        return ctx.reply(
            'VIP link yaratishda xatolik yuz berdi. Bot kanal/guruhda admin ekanini tekshiring.'
        );
    }
}

async function sendRules(ctx) {
    const text =
        `ℹ️ Marafon qoidalari:\n\n` +
        `1️⃣ Bot sizga shaxsiy taklif havolasini beradi.\n` +
        `2️⃣ Havolani SAT matematika bo'yicha tayyorlanayotgan do'stlaringizga yuboring.\n` +
        `3️⃣ Sizning havolangiz orqali botga kirgan har bir yangi foydalanuvchi uchun 1 ball beriladi.\n` +
        `4️⃣ Ballaringiz 3 va undan ko'p bo'lsa, VIP kanal va guruhga kirish imkoniyati ochiladi.\n` +
        `5️⃣ Ballaringiz 3 dan kam bo'lib qolsa, bot avtomatik tarzda sizni VIP kanal va guruhdan chiqaradi.\n\n` +
        `Barchasi avtomatik ishlaydi. Siz faqat do'stlaringizga havolani yuborib boring 😊`;

    return ctx.reply(text);
}

module.exports = {
    registerLinkHandler,
};
