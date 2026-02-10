const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    splitParams: '_SPLIT_',
    port: process.env.PORT,
    mongodbConnectionString: process.env.MONGODB_CONNECTION_STRING || '',
    mongodbDatabase: process.env.MONGODB_DATABASE_NAME || '',
    frontURL: process.env.FRONT_URL || "*",
    botToken: process.env.BOT_TOKEN  || "",
    telegrammHeader: process.env.TELEGRAMM_HEADER  || "",
    prod: process.env.LOCAL_DEVELOPMENT  == null,
    tgApiUrl:`https://api.telegram.org/bot${process.env.BOT_TOKEN}`,
    admins: process.env.ADMINS ? process.env.ADMINS.split(',') : [],
    ticketTypes: process.env.TICKET_TYPES ? JSON.parse(process.env.TICKET_TYPES) : {},
    cashier: process.env.CASHIER ? Number(process.env.CASHIER) : 480144364,
    ticketUrlBase: (process.env.TICKET_URL_BASE || 'https://example.com/ticket') + '/'
}