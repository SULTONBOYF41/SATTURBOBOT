// src/bot.js
const { Telegraf } = require('telegraf');
const { BOT_TOKEN } = require('./config');
require('./db'); // DB init

const { registerStartHandler } = require('./handlers/start');
const { registerRefHandler } = require('./handlers/ref');
const { registerPointsHandler } = require('./handlers/points');
const { registerLinkHandler } = require('./handlers/link');
const { registerBooksHandler } = require('./handlers/books');
const { checkVipUsers } = require('./services/vipService');
const { checkReferralActivity } = require('./services/referralMonitorService');

if (!BOT_TOKEN) {
    console.error('❌ BOT_TOKEN .env da topilmadi');
    process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// Handlers
registerStartHandler(bot);
registerRefHandler(bot);
registerPointsHandler(bot);
registerLinkHandler(bot);
registerBooksHandler(bot);

// Global error catcher
bot.catch((err, ctx) => {
    console.error('❌ Bot error:', err);
});

// 🔁 VIP userlarni har 10 daqiqada tekshirish
const VIP_INTERVAL_MINUTES = 10;
setInterval(() => {
    console.log(
        `\n[${new Date().toLocaleString()}] VIP monitoring tick (interval = ${VIP_INTERVAL_MINUTES} min)`
    );
    checkVipUsers(bot);
}, VIP_INTERVAL_MINUTES * 60 * 1000);

// 🔁 Referral monitoringni har 10 daqiqada ishga tushiramiz
const REFERRAL_INTERVAL_MINUTES = 10;
setInterval(() => {
    console.log(
        `\n[${new Date().toLocaleString()}] Referral monitoring tick (interval = ${REFERRAL_INTERVAL_MINUTES} min)`
    );
    checkReferralActivity(bot);
}, REFERRAL_INTERVAL_MINUTES * 60 * 1000);

// Debug: bir marta ishga tushganda tekshir
checkReferralActivity(bot);

// Botni ishga tushirish
bot
    .launch({ dropPendingUpdates: true })
    .then(() => {
        console.log('🚀 Turbo Booster bot ishga tushdi...');
        console.log(
            `VIP monitoring interval: ${VIP_INTERVAL_MINUTES} min, Referral monitoring interval: ${REFERRAL_INTERVAL_MINUTES} min`
        );
    })
    .catch((e) => {
        console.error('❌ bot.launch ERROR:', e);
        process.exit(1);
    });

// graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
