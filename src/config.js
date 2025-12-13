require('dotenv').config();

module.exports = {
    BOT_TOKEN: process.env.BOT_TOKEN,
    CLOSED_CHANNEL_ID: process.env.CLOSED_CHANNEL_ID,
    CLOSED_GROUP_ID: process.env.CLOSED_GROUP_ID,
    REQUIRED_CHANNEL_USERNAME: process.env.REQUIRED_CHANNEL_USERNAME,
};
