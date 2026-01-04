// src/config.js
const path = require('path');

require('dotenv').config({
    path: process.env.DOTENV_CONFIG_PATH || path.join(process.cwd(), '.env'),
});

function parseAdminIds(val) {
    if (!val) return [];
    return String(val)
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)
        .map((x) => Number(x))
        .filter((n) => Number.isFinite(n));
}

module.exports = {
    BOT_TOKEN: process.env.BOT_TOKEN,
    CLOSED_CHANNEL_ID: process.env.CLOSED_CHANNEL_ID,
    CLOSED_GROUP_ID: process.env.CLOSED_GROUP_ID,
    REQUIRED_CHANNEL_USERNAME: process.env.REQUIRED_CHANNEL_USERNAME,

    // ✅ Render disk uchun
    DB_PATH: process.env.DB_PATH || path.join(process.cwd(), 'database.sqlite'),

    // ✅ Admin IDs (kitob qo‘shish uchun)
    ADMIN_IDS: parseAdminIds(process.env.ADMIN_IDS),
};
