const dataService = require("../services/mongodb");
const crypto = require("crypto");
const fs = require("fs");
const FormData = require("form-data");
const config = require("../config/config");
const axios = require("axios");
const QRCode = require("qrcode");

const eventsMap = new Map();
const citesMap = new Map();
const placesMap = new Map();

const buyTickets = async (req, res) => {
  try {
    const { eventId, currency, tickets: ticketsString } = req.body;
    const { user } = req.telegramData;
    if (!user) {
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

const getTickets = async (req, res) => {
  try {
    const { user } = req.telegramData;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const tickets = await dataService.getDocuments('ticket', { userId: user.id });
    for (const ticket of tickets) {
      await updateTicket(ticket);
    }
    res.status(200).send(tickets);
    return;
  } catch (error) {
    console.log(error)
    res.status(500).send(error);
    return;
  }
};

const getTicket = async (req, res) => {
  try {
    const ticketId = req.params.ticketId;
    const ticket = await dataService.getDocument('ticket', ticketId);
    if(!ticket){
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }
    await updateTicket(ticket);
    res.status(200).send(ticket);
    return;
  } catch (error) {
    console.log(error)
    res.status(500).send(error);
    return;
  }
};

async function updateTicket(ticket) {
  if (eventsMap.has(ticket.event)) {
    const event = eventsMap.get(ticket.event);
    ticket.event = event;
  } else {
    const event = await dataService.getDocument('event', ticket.event);
    eventsMap.set(ticket.event, event);
    ticket.event = event;
    ticket.add = event.tickets.find(t => t.type === ticket.type)?.add || '';
  }
  if (citesMap.has(ticket.event.city)) {
    const city = citesMap.get(ticket.event.city);
    ticket.city = city;
  } else {
    const city = await dataService.getDocument('city', ticket.event.city);
    citesMap.set(ticket.event.city, city);
    ticket.city = city;
  }
  if (placesMap.has(ticket.event.place)) {
    const place = placesMap.get(ticket.event.place);
    ticket.place = place;
  } else {
    const place = await dataService.getDocument('place', ticket.event.place);
    placesMap.set(ticket.event.place, place);
    ticket.place = place;
  }
  return ticket;
}

const getQR = async (req, res) => {
  try {
    const ticketId = req.params.ticketId;

    const link = `${config.ticketUrlBase}${ticketId}`;

    res.setHeader('Content-Type', 'image/png');

    await QRCode.toFileStream(res, link, {
      type: 'png',
      width: 512,
      margin: 2,
    });
    return;
  } catch (error) {
    console.log(error)
    res.status(500).send(error);
    return;
  }
};

module.exports = {
  buyTickets: buyTickets,
  getTickets: getTickets,
  getTicket: getTicket,
  getQR: getQR,
};
