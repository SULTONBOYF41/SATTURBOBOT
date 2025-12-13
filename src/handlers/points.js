const { BUTTON_POINTS } = require('../keyboards/mainKeyboard');
const { getUserByTelegramId } = require('../services/userService');

function registerPointsHandler(bot) {
    bot.command('ballarim', async (ctx) => {
        await sendPoints(ctx);
    });

    bot.hears(BUTTON_POINTS, async (ctx) => {
        await sendPoints(ctx);
    });
}

async function sendPoints(ctx) {
    try {
        const user = await getUserByTelegramId(ctx.from.id);
        if (!user) {
            return ctx.reply('Avval /start ni bosing.');
        }

        const need = Math.max(0, 3 - user.points);
        let text =
            `📊 Ballaringiz: ${user.points}\n\n` +
            `3+ ball bo'lsa, yopiq kanal va guruhga kirish huquqiga ega bo'lasiz.\n`;

        if (user.points >= 3) {
            text +=
                `✅ Hozir siz kirish huquqiga egasiz.\n` +
                `🔐 "VIP link" tugmasi yoki /link buyrug'i orqali bir martalik link olishingiz mumkin.\n`;
        } else {
            text +=
                `❌ Sizga hali ${need} ball yetishmaydi.\n` +
                `Do'stlaringizni "Taklif havolasi" orqali taklif qiling.`;
        }

        if (user.has_vip_access && user.points < 3) {
            text +=
                `\n⚠️ Eslatma: Siz ilgari VIP bo'limga kira olgan bo'lishingiz mumkin, lekin hozir ballaringiz 3 dan kam.\n` +
                `Bot yaqin daqiqalarda sizni yopiq guruh va kanaldan chiqaradi.`;
        }

        return ctx.reply(text);
    } catch (e) {
        console.error('sendPoints error:', e);
        return ctx.reply('Xatolik yuz berdi.');
    }
}

module.exports = {
    registerPointsHandler,
};
