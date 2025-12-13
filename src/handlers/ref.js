const { BUTTON_REF } = require('../keyboards/mainKeyboard');
const { getUserByTelegramId } = require('../services/userService');

function registerRefHandler(bot) {
    // /ref komandasi
    bot.command('ref', async (ctx) => {
        await sendRefLink(ctx);
    });

    // Tugma bosilganda
    bot.hears(BUTTON_REF, async (ctx) => {
        await sendRefLink(ctx);
    });
}

async function sendRefLink(ctx) {
    try {
        const user = await getUserByTelegramId(ctx.from.id);
        if (!user) {
            return ctx.reply('Avval /start yoki "Start" bosib ro‘yxatdan o‘ting.');
        }

        const link = `https://t.me/${ctx.botInfo.username}?start=${user.ref_code}`;

        return ctx.reply(
            `🔗 Sizning shaxsiy taklif havolangiz:\n\n` +
            `${link}\n\n` +
            `Bu havolani SAT matematika bo'yicha tayyorlanayotgan do'stlaringizga yuboring.\n` +
            `Har bir yangi qatnashchi uchun 1 ball qo'shiladi.`
        );
    } catch (e) {
        console.error('sendRefLink error:', e);
        return ctx.reply('Taklif havolasini yaratishda xatolik yuz berdi.');
    }
}

module.exports = {
    registerRefHandler,
};
