// src/services/userService.js

const db = require('../db');

function nowIso() {
    return new Date().toISOString();
}

/**
 * Userni DB dan topadi yoki yaratadi.
 * Agar refCode bo'lsa, shunga mos inviterni qidiradi va qaytaradi.
 */
function getOrCreateUser(ctx, refCode = null) {
    const telegramId = ctx.from.id;
    const username = ctx.from.username || null;
    const firstName = ctx.from.first_name || null;
    const lastName = ctx.from.last_name || null;
    const now = nowIso();

    console.log('getOrCreateUser CALLED:', {
        telegramId,
        username,
        firstName,
        lastName,
        refCode,
    });

    return new Promise((resolve, reject) => {
        db.get(
            'SELECT * FROM users WHERE telegram_id = ?',
            [telegramId],
            (err, row) => {
                if (err) {
                    console.error('getOrCreateUser SELECT user ERROR:', err);
                    return reject(err);
                }

                // 🔁 Mavjud user bo'lsa
                if (row) {
                    console.log('getOrCreateUser: existing user found:', {
                        telegramId,
                        id: row.id,
                        points: row.points,
                    });

                    db.run(
                        `UPDATE users
             SET username = ?, first_name = ?, last_name = ?, updated_at = ?
             WHERE telegram_id = ?`,
                        [username, firstName, lastName, now, telegramId],
                        (updateErr) => {
                            if (updateErr) {
                                console.error('getOrCreateUser UPDATE user ERROR:', updateErr);
                            }
                        }
                    );

                    return resolve({ user: row, inviter: null, isNew: false });
                }

                // 🆕 Yangi user
                const selfRefCode = `ref_${telegramId}`;
                console.log(
                    'getOrCreateUser: no existing user, creating new with refCode:',
                    selfRefCode
                );

                const insertUser = (referredByTelegramId = null, inviterObj = null) => {
                    console.log(
                        'getOrCreateUser: inserting new user with referredByTelegramId:',
                        referredByTelegramId
                    );

                    db.run(
                        `INSERT INTO users
             (telegram_id, username, first_name, last_name, ref_code, referred_by, points, has_vip_access, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, ?)`,
                        [
                            telegramId,
                            username,
                            firstName,
                            lastName,
                            selfRefCode,
                            referredByTelegramId,
                            now,
                            now,
                        ],
                        function (err2) {
                            if (err2) {
                                console.error('getOrCreateUser INSERT user ERROR:', err2);
                                return reject(err2);
                            }

                            console.log(
                                'getOrCreateUser: new user inserted with rowid:',
                                this.lastID
                            );

                            db.get(
                                'SELECT * FROM users WHERE id = ?',
                                [this.lastID],
                                (err3, newUser) => {
                                    if (err3) {
                                        console.error(
                                            'getOrCreateUser SELECT inserted user ERROR:',
                                            err3
                                        );
                                        return reject(err3);
                                    }

                                    console.log(
                                        'getOrCreateUser: returning new user + inviter:',
                                        {
                                            newUserId: newUser.id,
                                            inviterTelegramId: inviterObj
                                                ? inviterObj.telegram_id
                                                : null,
                                        }
                                    );

                                    resolve({
                                        user: newUser,
                                        inviter: inviterObj,
                                        isNew: true,
                                    });
                                }
                            );
                        }
                    );
                };

                // ❌ refCode bo'lmasa – referralsiz user
                if (!refCode) {
                    console.log(
                        'getOrCreateUser: no refCode provided, creating user without inviter.'
                    );
                    return insertUser(null, null);
                }

                // refCode bo'lsa – inviter qidiriladi
                console.log(
                    'getOrCreateUser: refCode provided, searching inviter by refCode:',
                    refCode
                );

                db.get(
                    'SELECT * FROM users WHERE ref_code = ?',
                    [refCode],
                    (err2, inviter) => {
                        if (err2) {
                            console.error('getOrCreateUser SELECT inviter ERROR:', err2);
                            return reject(err2);
                        }

                        if (!inviter) {
                            console.log(
                                'getOrCreateUser: inviter NOT found for refCode:',
                                refCode
                            );
                        } else {
                            console.log(
                                'getOrCreateUser: inviter found for refCode:',
                                {
                                    refCode,
                                    inviterTelegramId: inviter.telegram_id,
                                    inviterId: inviter.id,
                                }
                            );
                        }

                        const referredByTelegramId = inviter ? inviter.telegram_id : null;
                        insertUser(referredByTelegramId, inviter || null);
                    }
                );
            }
        );
    });
}

/**
 * Inviterga 1 ball qo'shadi (agar oldin bu invited bilan referal yozilmagan bo'lsa)
 * referrals jadvalida is_active = 1 bilan saqlanadi
 */
function addPoint(inviterTelegramId, invitedTelegramId) {
    console.log('addPoint CALLED:', { inviterTelegramId, invitedTelegramId });

    return new Promise((resolve, reject) => {
        const now = nowIso();

        db.get(
            'SELECT * FROM referrals WHERE inviter_id = ? AND invited_id = ?',
            [inviterTelegramId, invitedTelegramId],
            (err, row) => {
                if (err) {
                    console.error('addPoint SELECT referral ERROR:', err);
                    return reject(err);
                }

                if (row) {
                    console.log(
                        'addPoint: referral already exists, POINT NOT ADDED:',
                        {
                            inviterTelegramId,
                            invitedTelegramId,
                            referralId: row.id,
                            is_active: row.is_active,
                        }
                    );
                    return resolve(false); // allaqachon hisoblangan
                }

                console.log('addPoint: inserting new referral record (is_active=1)...');

                db.run(
                    `INSERT INTO referrals (inviter_id, invited_id, created_at, is_active)
           VALUES (?, ?, ?, 1)`,
                    [inviterTelegramId, invitedTelegramId, now],
                    (err2) => {
                        if (err2) {
                            console.error('addPoint INSERT referral ERROR:', err2);
                            return reject(err2);
                        }

                        console.log(
                            'addPoint: referral inserted, updating inviter points (+1)...'
                        );

                        db.run(
                            `UPDATE users
               SET points = points + 1, updated_at = ?
               WHERE telegram_id = ?`,
                            [now, inviterTelegramId],
                            (err3) => {
                                if (err3) {
                                    console.error(
                                        'addPoint UPDATE inviter points ERROR:',
                                        err3
                                    );
                                    return reject(err3);
                                }

                                console.log(
                                    'addPoint: inviter points successfully incremented (+1).'
                                );
                                resolve(true);
                            }
                        );
                    }
                );
            }
        );
    });
}

/**
 * Telegram ID bo'yicha userni olish
 */
function getUserByTelegramId(telegramId) {
    console.log('getUserByTelegramId CALLED:', { telegramId });

    return new Promise((resolve, reject) => {
        db.get(
            'SELECT * FROM users WHERE telegram_id = ?',
            [telegramId],
            (err, row) => {
                if (err) {
                    console.error('getUserByTelegramId ERROR:', err);
                    return reject(err);
                }

                console.log('getUserByTelegramId RESULT:', row
                    ? { id: row.id, points: row.points, has_vip_access: row.has_vip_access }
                    : null
                );

                resolve(row || null);
            }
        );
    });
}

/**
 * Userni VIP sifatida belgilash yoki VIP flagini o'chirish
 */
function setVipAccessFlag(telegramId, flag) {
    const now = nowIso();
    console.log('setVipAccessFlag CALLED:', { telegramId, flag });

    return new Promise((resolve, reject) => {
        db.run(
            'UPDATE users SET has_vip_access = ?, updated_at = ? WHERE telegram_id = ?',
            [flag ? 1 : 0, now, telegramId],
            function (err) {
                if (err) {
                    console.error('setVipAccessFlag ERROR:', err);
                    return reject(err);
                }
                console.log(
                    'setVipAccessFlag SUCCESS for telegramId:',
                    telegramId,
                    'flag =',
                    flag
                );
                resolve();
            }
        );
    });
}

/**
 * VIP bo'lgan (has_vip_access = 1), lekin balli 3 dan kam userlarni qaytaradi
 * (VIP tekshiruv uchun kerak)
 */
function getVipUsersWithLowPoints() {
    console.log('getVipUsersWithLowPoints CALLED');

    return new Promise((resolve, reject) => {
        db.all(
            'SELECT * FROM users WHERE has_vip_access = 1 AND points < 3',
            [],
            (err, rows) => {
                if (err) {
                    console.error('getVipUsersWithLowPoints ERROR:', err);
                    return reject(err);
                }

                console.log(
                    'getVipUsersWithLowPoints RESULT count:',
                    rows ? rows.length : 0
                );

                resolve(rows || []);
            }
        );
    });
}

module.exports = {
    getOrCreateUser,
    addPoint,
    getUserByTelegramId,
    setVipAccessFlag,
    getVipUsersWithLowPoints,
};
