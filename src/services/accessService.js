const { REQUIRED_CHANNEL_USERNAME } = require('../config');

/**
 * User majburiy kanalda a'zo yoki yo'qligini tekshiradi.
 * REQUIRED_CHANNEL_USERNAME bo'sh bo'lsa -> true (tekshiruv o'chadi).
 */
async function checkRequiredChannel(ctx) {
    // Agar sozlanmagan bo'lsa, tekshiruvni o'chirib qo'yamiz
    if (!REQUIRED_CHANNEL_USERNAME) {
        console.log(
            'checkRequiredChannel: REQUIRED_CHANNEL_USERNAME bo\'sh, tekshiruv SKIP qilindi.'
        );
        return true;
    }

    console.log('checkRequiredChannel: CALLED', {
        requiredChannel: REQUIRED_CHANNEL_USERNAME,
        userId: ctx.from.id,
        username: ctx.from.username,
    });

    try {
        const chatIdOrUsername = REQUIRED_CHANNEL_USERNAME; // @username yoki -100... bo'lishi mumkin

        const member = await ctx.telegram.getChatMember(
            chatIdOrUsername,
            ctx.from.id
        );

        console.log('checkRequiredChannel: getChatMember RESULT:', {
            status: member.status,
            userId: member.user.id,
            isCreator: member.status === 'creator',
            isAdmin: member.status === 'administrator',
            isMember: member.status === 'member',
        });

        const status = member.status; // creator, administrator, member, restricted, left, kicked

        if (['creator', 'administrator', 'member'].includes(status)) {
            console.log(
                'checkRequiredChannel: user IS in required channel. Access GRANTED.'
            );
            return true;
        }

        console.log(
            'checkRequiredChannel: user is NOT in required channel. Status:',
            status
        );
        return false;
    } catch (e) {
        console.error('checkRequiredChannel ERROR:', e.message);
        // Agar getChatMember xato etsa (masalan, bot o'sha kanalda admin emas bo'lsa), bu yerga tushadi
        // Bunday holda, xavfsizlik uchun false qaytaramiz, userdan required kanalga a'zo bo'lishini so'raymiz
        return false;
    }
}

module.exports = {
    checkRequiredChannel,
};
