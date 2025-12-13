const {
    CLOSED_CHANNEL_ID,
    CLOSED_GROUP_ID,
} = require('../config');
const {
    getVipUsersWithLowPoints,
    setVipAccessFlag,
} = require('./userService');

/**
 * Har 10 daqiqada chaqiriladi.
 * has_vip_access = 1 va points < 3 bo'lgan userlarni kanal/guruhdan chiqaradi.
 */
async function checkVipUsers(bot) {
    try {
        const users = await getVipUsersWithLowPoints();
        if (!users.length) return;

        console.log(
            `VIP tekshiruv: ${users.length} ta user points<3 bo'lganligi uchun chiqariladi.`
        );

        for (const user of users) {
            const userId = user.telegram_id;

            // Guruhdan chiqarish
            if (CLOSED_GROUP_ID) {
                try {
                    await bot.telegram.banChatMember(CLOSED_GROUP_ID, userId);
                    await bot.telegram.unbanChatMember(CLOSED_GROUP_ID, userId);
                } catch (errGroup) {
                    console.error('Guruhdan chiqarishda xatolik:', errGroup.message);
                }
            }

            // Kanaldan chiqarish
            if (CLOSED_CHANNEL_ID) {
                try {
                    await bot.telegram.banChatMember(CLOSED_CHANNEL_ID, userId);
                    await bot.telegram.unbanChatMember(CLOSED_CHANNEL_ID, userId);
                } catch (errChannel) {
                    console.error('Kanaldan chiqarishda xatolik:', errChannel.message);
                }
            }

            // Userga DM
            try {
                await bot.telegram.sendMessage(
                    userId,
                    `⚠️ Ballaringiz 3 dan kam bo'lib qoldi (hozir: ${user.points}).\n` +
                    `Shuning uchun siz maxsus kanal va guruhdan chiqarildingiz.\n\n` +
                    `Agar keyin yana 3+ ball yig'sangiz, /link yoki "🔐 VIP link" tugmasi orqali qayta kirish uchun yangi link olishingiz mumkin.`
                );
            } catch (errDM) {
                console.error('DM yuborishda xatolik:', errDM.message);
            }

            await setVipAccessFlag(userId, 0);
        }
    } catch (e) {
        console.error('checkVipUsers umumiy xatolik:', e.message);
    }
}

module.exports = {
    checkVipUsers,
};
