const dataService = require("../services/mongodb");
const eventsService = require("../services/eventsService");
const citiesService = require("../services/citiesService");
const crypto = require("crypto");
const fs = require("fs");
const FormData = require("form-data");
const config = require("../config/config");
const axios = require("axios");
const QRCode = require("qrcode");

const eventsMap = new Map();
const placesMap = new Map();

const buyTickets = async (req, res) => {
  try {
    const {  currency, tickets: ticketsString } = req.body;
    const { user } = req.telegramData;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const bookingId = crypto.randomBytes(10).toString('base64url');
    const tickets = JSON.parse(ticketsString);
    const newTickets = tickets.map(ticket => ({
      userId: user.id,
      event: ticket.eventId,
      bookingId,
      type: ticket.type,
      currency,
      method: 'bank',
      price: ticket.price,
      cashier: config.cashier,
      confirmed: false,
      add: ticket.add,
    }));
    await dataService.createDocuments('ticket', newTickets);
    const form = new FormData();
    form.append('chat_id', config.cashier);
    form.append('parse_mode', 'HTML');
    form.append('photo', fs.createReadStream(req.file.path));
    const userLink = `<a href="tg://user?id=${user.id}">${user.first_name || 'Пользователь'}</a>`;
    const total = tickets.reduce((acc, ticket) => acc += ticket.price, 0);
    const ticketStrings = newTickets.map(async (ticket) => {
      const event = await eventsService.getEventFromCache(ticket.event);
      console.log('ticket', ticket)
      console.log('event', event)
      return `${citiesService.citiesMap.get(event.city)} ${event.date} ${config.eventTypes[event.type]} ${config.ticketTypes[ticket.type]}`
    })
    form.append('caption', `Оплата от ${userLink} за билеты: ${ticketStrings.join(', ')}. На общую сумму ${total}${currency === 'VND' ? '.000 VND' : currency === 'RUB' ? ' руб' : ' USDT'}`);
    form.append('reply_markup', JSON.stringify({
      inline_keyboard: [
        [{ text: "Подтвердить", callback_data: `CONFIRM_SPLIT_${bookingId}` }],
        [{ text: "Неправильная сумма", callback_data: `WRONG_SPLIT_${bookingId}` }],
        [{ text: "Маркетинговые билеты", callback_data: `MARKETING_SPLIT_${bookingId}` }],
        [{ text: "Деньги не поступили", callback_data: `DROP_SPLIT_${bookingId}` }]
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
  if (citiesService.citiesMap.has(ticket.event.city)) {
    const city = citiesService.citiesMap.get(ticket.event.city);
    ticket.city = city;
  } else {
    const city = await dataService.getDocument('city', ticket.event.city);
    citiesService.citesMap.set(ticket.event.city, city);
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

const getSoldTickets = async (req, res) => {
  try {
    const tickets = await dataService.getDocuments('ticket', { event: req.params.eventId, confirmed: true });
    res.status(200).send(tickets);
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
  getSoldTickets: getSoldTickets,
};
