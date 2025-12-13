const config = require('../config');
const { mainKeyboard } = require('../keyboards/mainKeyboard');
const {
    getOrCreateUser,
    addPoint,
    getUserByTelegramId,
} = require('../services/userService');
const { checkRequiredChannel } = require('../services/accessService');

function registerStartHandler(bot) {
    bot.start(async (ctx) => {
        const args = ctx.message.text.split(' ');
        const refCode = args[1] || null;

        console.log('--- /start CALLED ---');
        console.log('Message text:', ctx.message.text);
        console.log('Parsed refCode:', refCode);
        console.log('From user:', {
            id: ctx.from.id,
            username: ctx.from.username,
            first_name: ctx.from.first_name,
        });

        try {
            // 1️⃣ AVVAL USERNI YARATAMIZ VA REFERALNI HISOBLAYMIZ
            const { user, inviter, isNew } = await getOrCreateUser(ctx, refCode);

            console.log('getOrCreateUser RESULT in /start:', {
                userTelegramId: user.telegram_id,
                userId: user.id,
                userPoints: user.points,
                isNew,
                inviterTelegramId: inviter ? inviter.telegram_id : null,
            });

            if (isNew && inviter && inviter.telegram_id !== user.telegram_id) {
                console.log('New user with valid inviter, calling addPoint...', {
                    inviterTelegramId: inviter.telegram_id,
                    invitedTelegramId: user.telegram_id,
                });

                const added = await addPoint(inviter.telegram_id, user.telegram_id);
                console.log('addPoint RESULT in /start:', { added });

                if (added) {
                    const inviterUser = await getUserByTelegramId(inviter.telegram_id);
                    console.log('Inviter user after addPoint:', {
                        inviterTelegramId: inviter.telegram_id,
                        inviterDbId: inviterUser ? inviterUser.id : null,
                        inviterPoints: inviterUser ? inviterUser.points : null,
                    });

                    await ctx.telegram.sendMessage(
                        inviter.telegram_id,
                        `🎉 Sizga yangi ball qo'shildi!\n` +
                        `Jami ballaringiz oshdi (aniq sonni "📊 Ballarim" tugmasi bilan ko'ring).\n\n` +
                        `3+ ball yig'sangiz, "🔐 VIP link" tugmasi orqali yopiq kanal va guruhga kirish linkini olishingiz mumkin.`
                    );
                } else {
                    console.log(
                        'addPoint returned false (probably referral already counted).'
                    );
                }
            } else {
                console.log(
                    'No addPoint call (either not new user, no inviter, or self-referral).',
                    { isNew, inviterExists: !!inviter }
                );
            }

            // 2️⃣ ENDI MAJBURIY KANALGA A'ZOLIKNI TEKSHIRAMIZ
            console.log(
                'Checking required channel for user:',
                ctx.from.id,
                'REQUIRED_CHANNEL_USERNAME =',
                config.REQUIRED_CHANNEL_USERNAME
            );

            const ok = await checkRequiredChannel(ctx);
            console.log('checkRequiredChannel RESULT:', ok);

            if (!ok) {
                const required = config.REQUIRED_CHANNEL_USERNAME || 'Kanal sozlanmagan';
                const link =
                    required.startsWith('@')
                        ? `https://t.me/${required.replace('@', '')}`
                        : required.startsWith('-100')
                            ? '(ID orqali kanal, username sozlashingiz mumkin)'
                            : required;

                console.log(
                    'User is NOT in required channel, sending warning. REQUIRED_CHANNEL_USERNAME:',
                    required
                );

                return ctx.reply(
                    `🚫 Botdan foydalanishdan oldin majburiy kanalda a'zo bo'ling.\n\n` +
                    `👉 Kanal: ${required}\n` +
                    (link.startsWith('http')
                        ? `🔗 Havola: ${link}\n\n`
                        : '\n') +
                    `A'zo bo'lgach, /start ni qayta yuboring.`
                );
            }

            // 3️⃣ HAMMASI JOYIDA BO'LSA – ASOSIY MENYU
            console.log('User passed required channel check, sending main menu.');

            const text =
                `Assalomu alaykum, ${ctx.from.first_name || ''}!\n\n` +
                `🎯 Turbo Booster SAT marafoni botiga xush kelibsiz.\n\n` +
                `Do'stlaringizni taklif qilib ball yig'ing.\n` +
                `3+ ball bo'lsa, maxsus yopiq kanal va guruhga kirasiz.\n\n` +
                `Quyidagi tugmalar orqali boshqarishingiz mumkin.`;

            return ctx.reply(text, mainKeyboard);
        } catch (e) {
            console.error('start handler error:', e);
            return ctx.reply('Xatolik yuz berdi. Keyinroq qayta urinib ko‘ring.');
        }
    });
}

module.exports = {
    registerStartHandler,
};
