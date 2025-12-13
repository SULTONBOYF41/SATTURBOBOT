const { Markup } = require('telegraf');

const BUTTON_REF = '🔗 Taklif havolasi';
const BUTTON_POINTS = '📊 Ballarim';
const BUTTON_LINK = '🔐 VIP link';
const BUTTON_RULES = 'ℹ️ Qoidalar';

const mainKeyboard = Markup.keyboard([
    [BUTTON_REF, BUTTON_POINTS],
    [BUTTON_LINK, BUTTON_RULES],
])
    .resize()
    .persistent(); // klaviatura doim ko'rinib turadi

module.exports = {
    mainKeyboard,
    BUTTON_REF,
    BUTTON_POINTS,
    BUTTON_LINK,
    BUTTON_RULES,
};
