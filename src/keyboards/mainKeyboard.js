const { Markup } = require('telegraf');

const BUTTON_REF = 'Taklif havolasi';
const BUTTON_POINTS = 'Ballarim';
const BUTTON_LINK = 'VIP link';
const BUTTON_RULES = 'Qoidalar';
const BUTTON_BOOKS = 'Kitoblar';

const mainKeyboard = Markup.keyboard([
    [BUTTON_REF, BUTTON_POINTS],
    [BUTTON_LINK, BUTTON_RULES],
    [BUTTON_BOOKS],
])
    .resize()
    .persistent(); // keyboard always visible

module.exports = {
    mainKeyboard,
    BUTTON_REF,
    BUTTON_POINTS,
    BUTTON_LINK,
    BUTTON_RULES,
    BUTTON_BOOKS,
};
