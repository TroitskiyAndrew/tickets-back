const dataService = require("../services/mongodb");
const crypto = require("crypto");
const fs = require("fs");
const FormData = require("form-data");
const config = require("../config/config");
const axios = require("axios");

const buyTickets = async (req, res) => {
  console.log('buyTickets_ req.body ', req.body);
  try {
    const { eventId, currency, tickets: ticketsString } = req.body;
    const { user } = req.telegramData;
    if(!user){
       res.status(401).json({ error: 'Unauthorized' });
       return;
    }
    const bookingId = crypto.randomBytes(10).toString('base64url');
    const tickets = JSON.parse(ticketsString);
    const newTickets = tickets.map(ticket => ({
      userId: user.id,
      event: eventId,
      bookingId,
      type: ticket.type,
      currency,
      method: 'bank',
      price: ticket.price,
      cashier: config.cashier,
      confirmed: false,
    }));
    await dataService.createDocuments('ticket', newTickets);
    const form = new FormData();
    form.append('chat_id', config.cashier);
    form.append('parse_mode', 'HTML');
    form.append('photo', fs.createReadStream(req.file.path));
    const userLink = `<a href="tg://user?id=${user.id}">${user.first_name || 'Пользователь'}</a>`;
    form.append('caption', `Оплата от ${userLink} на сумму ${tickets.reduce((acc, ticket) => acc += ticket.price, 0)}${currency === 'VND' ? '.000 VND' : ' руб'} за ${tickets.length} билет${tickets.length === 1 ? '' : tickets.length <= 4 ? 'а' : 'ов'}`);
    form.append('reply_markup', JSON.stringify({
      inline_keyboard: [
        [{ text: "Подтвердить", callback_data: `CONFIRM_${bookingId}` }],
        [{ text: "Неправильная сумма", callback_data: `WRONG_${bookingId}` }],
        [{ text: "Деньги не поступили", callback_data: `DROP_${bookingId}` }]
      ]
    }));
    await axios.post(`${config.tgApiUrl}/sendPhoto`, form,
      { headers: form.getHeaders() });

    res.status(200).send(newTickets);
    return;
  } catch (error) {
    console.log(error)
    res.status(500).send(error);
    return;
  }
};



module.exports = {
  buyTickets: buyTickets,
};
