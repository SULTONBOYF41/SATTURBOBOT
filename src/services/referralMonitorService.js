// src/services/referralMonitorService.js

const db = require('../db');
const { REQUIRED_CHANNEL_USERNAME } = require('../config');

/**
 * Chiroyli vaqt formatlash
 */
function timeNow() {
    const now = new Date();
    const pad = (n) => (n < 10 ? '0' + n : n);

    return (
        now.getFullYear() +
        '-' +
        pad(now.getMonth() + 1) +
        '-' +
        pad(now.getDate()) +
        ' ' +
        pad(now.getHours()) +
        ':' +
        pad(now.getMinutes()) +
        ':' +
        pad(now.getSeconds())
    );
}

/**
 * Keyingi monitoring taxminiy vaqtini ko'rsatish
 */
function nextRunIn(minutes) {
    const now = Date.now();
    const next = new Date(now + minutes * 60 * 1000);
    return next.toLocaleString();
}

/**
 * Barcha referrals ro'yxatini olish
 */
function getAllReferrals() {
    return new Promise((resolve, reject) => {
        db.all(
            'SELECT id, inviter_id, invited_id, is_active FROM referrals',
            [],
            (err, rows) => {
                if (err) {
                    console.error('getAllReferrals ERROR:', err);
                    return reject(err);
                }
                resolve(rows || []);
            }
        );
    });
}

/**
 * Referralni is_active = 0 yoki 1 qilish
 */
function setReferralActive(referralId, isActive) {
    return new Promise((resolve, reject) => {
        db.run(
            'UPDATE referrals SET is_active = ? WHERE id = ?',
            [isActive ? 1 : 0, referralId],
            function (err) {
                if (err) {
                    console.error('setReferralActive ERROR:', err);
                    return reject(err);
                }
                resolve();
            }
        );
    });
}

/**
 * Inviterning ballarini delta ga o'zgartirish (delta -1 bo'lishi mumkin),
 * points hech qachon 0 dan past tushmaydi.
 */
function changeInviterPoints(inviterTelegramId, delta) {
    return new Promise((resolve, reject) => {
        db.run(
            `
      UPDATE users
      SET points = CASE
        WHEN points + ? < 0 THEN 0
        ELSE points + ?
      END
      WHERE telegram_id = ?
    `,
            [delta, delta, inviterTelegramId],
            function (err) {
                if (err) {
                    console.error('changeInviterPoints ERROR:', err);
                    return reject(err);
                }
                resolve();
            }
        );
    });
}

/**
 * ASOSIY: Referral monitoring
 */
async function checkReferralActivity(bot) {
    const start = timeNow();
    console.log(`\n========== REFERRAL MONITORING STARTED at ${start} ==========`);

    if (!REQUIRED_CHANNEL_USERNAME) {
        console.log(
            `${timeNow()} | REQUIRED_CHANNEL_USERNAME bo'sh → monitoring SKIP`
        );
        return;
    }

    try {
        const referrals = await getAllReferrals();

        console.log(`${timeNow()} | Jami referrals: ${referrals.length}`);

        for (const ref of referrals) {
            const { id, inviter_id, invited_id, is_active } = ref;

            console.log(
                `${timeNow()} | ReferralID=${id} | inviter=${inviter_id} → invited=${invited_id} | active=${is_active}`
            );

            if (!is_active) continue;

            let isMember = false;

            try {
                const member = await bot.telegram.getChatMember(
                    REQUIRED_CHANNEL_USERNAME,
                    invited_id
                );

                const status = member.status;
                isMember = ['creator', 'administrator', 'member'].includes(status);

                console.log(
                    `${timeNow()} | invited ${invited_id} status=${status} | isMember=${isMember}`
                );
            } catch (e) {
                console.error(
                    `${timeNow()} | getChatMember ERROR (invited=${invited_id}):`,
                    e.message
                );
                isMember = false;
            }

            if (isMember) continue;

            console.log(
                `${timeNow()} | ❌ invited ${invited_id} required kanalda emas → inviter ${inviter_id} ball -1`
            );

            await changeInviterPoints(inviter_id, -1);
            await setReferralActive(id, 0);

            try {
                await bot.telegram.sendMessage(
                    inviter_id,
                    `⚠️ Taklif qilgan odamingiz majburiy kanaldan chiqib ketdi.\n` +
                    `❌ Shu sababli ballaringizdan 1 ball olib tashlandi.`
                );
            } catch (errDM) {
                console.error(
                    `${timeNow()} | inviterga DM yuborishda xato:`,
                    errDM.message
                );
            }
        }

        const finish = timeNow();
        console.log(
            `========== REFERRAL MONITORING FINISHED at ${finish} ==========\n`
        );
        console.log(
            `➡️ Next referral check approximately at: ${nextRunIn(10)}`
        );
    } catch (e) {
        console.error(`${timeNow()} | checkReferralActivity XATO:`, e.message);
    }
}

module.exports = {
    checkReferralActivity,
};
