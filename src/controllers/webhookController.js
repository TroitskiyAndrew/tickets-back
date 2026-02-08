const dataService = require("../services/mongodb");
const citiesService = require("../services/citiesService");
const eventsService = require("../services/eventsService");
const membersService = require("../services/membersService");
const config = require("../config/config");
const axios = require("axios");
const { ObjectId } = require("mongodb");
const { sendMessage } = require("../services/messageService");

const handleWebhook = async (req, res) => {
  try {
    const update = req.body;
    let isAdmin = false;
    if (update._sendMessage) {
      res.json({ ok: true });
      console.log(req.body)
      sendMessage(req.body.chat_id, req.body.text, req.body.reply_markup)
      return;
    }

    if (update.callback_query) {
      let emptyButton = false;
      const cq = update.callback_query;
      const data = cq.data;
      const chat_id = cq.message.chat.id;
      const reply_markup = cq.message.reply_markup;
      const [action, value] = data.split('=');
      const userId = cq.from.id.toString()
      isAdmin = config.admins.includes(userId)
      let text = 'Рандомный текст';
      if (data === 'getCities') {
        const cities = await citiesService.getCities();
        reply_markup.inline_keyboard = cities.map(city => [
          { text: `${city.name}(${city.events.map(event => event.date).join(', ')})`, callback_data: `CITY_${city.id}` },
        ])
        reply_markup.inline_keyboard.push([
          { text: "Назад", callback_data: `HOME` },
        ])
        text = "Текст про список городов"
      } else {
        const [action, value, context] = data.split('_');
        switch (action) {
          case 'CITY': {
            const events = await eventsService.getEventsByCity(value);
            reply_markup.inline_keyboard = events.map(event => [
              { text: `${event.type}, ${event.date}`, callback_data: `EVENT_${event.id}_${value}` },
            ])
            reply_markup.inline_keyboard.push([
              { text: "Назад", callback_data: 'HOME' },
            ])
            text = "Текст про список ивентов"
            break;
          }
          case 'EVENT': {
            const event = await eventsService.getEvent(value);
            reply_markup.inline_keyboard = event.tickets.map(ticket => [
              { text: `${config.ticketTypes[ticket.type.toString()] || 'Какой-то билет'}, ${ticket.priceVND}.000 VND/${ticket.priceRub} руб`, callback_data: `TICKET_${ticket.type}` },
            ])
            reply_markup.inline_keyboard.push([
              { text: "Назад", callback_data: `CITY_${context}` },
            ])
            text = "Текст про список билетов"
            break;
          }
          case 'HOME': {
            reply_markup.inline_keyboard = [
              [
                { text: "Список городов", callback_data: "getCities" },
              ]
            ]
            text = "Добро пожаловать!"
            break;
          }
          default:
            emptyButton = true
            break;
        }
      }
      if (!emptyButton) {
        await axios.post(`${config.tgApiUrl}/editMessageText`, {
          chat_id,
          message_id: cq.message.message_id,
          text,
          reply_markup,
        });
      }

      await axios.post(`${config.tgApiUrl}/answerCallbackQuery`, {
        callback_query_id: cq.id,
        // text: responseText
      });


    }
    const message = update.message
    if (message && message.text === "/start") {
      await fetch(`${config.tgApiUrl}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: message.chat.id,
          text: "Добро пожаловать!",
          reply_markup: {
            inline_keyboard: [
              [
                { text: "Список городов", callback_data: "getCities" },
              ]
            ]
          }
        })
      });

    }
    // if (message && message.text.startsWith('Create')) {
    //   const events = message.text.split(';');
    //   for (const event of events) {
    //     const [_, place,type, date] = event.split(':');
    //     await dataService.createDocument("event", {
    //       place, type, date, tickets: [
    //         { type: 0, count: 5, price: 0, priceRub: 0 },
    //         { type: 1, count: 30, priceVND: 500, priceRub: 1500 },
    //         { type: 2, count: 60, priceVND: 700, priceRub: 2100 },
    //         { type: 3, count: 10, priceVND: 100, priceRub: 3000 },
    //       ]
    //     });
    //   }
    // }


    res.json({ ok: true });
  } catch (error) {
    console.log(error)
    res.status(500).send(error);
    return;
  }
};

module.exports = {
  handleWebhook: handleWebhook,
};
