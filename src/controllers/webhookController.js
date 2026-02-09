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
      const userId = cq.from.id.toString()
      isAdmin = config.admins.includes(userId)
      let text = cq.message.text;
      if (data === 'getCities') {
        const cities = await citiesService.getCities();
        reply_markup.inline_keyboard = cities.map(city => [
          { text: `${city.name} (${city.events.map(event => event.date).join(', ')})`, callback_data: `CITY_${city.id}` },
        ])
        reply_markup.inline_keyboard.push([
          { text: "Назад", callback_data: `HOME` },
        ])
        text = "Текст про список городов";
      } else {
        const [action, value, context, stateStr] = data.split('_');
        switch (action) {
          case 'CITY': {
            const events = await eventsService.getEventsByCity(value);
            reply_markup.inline_keyboard = events.map(event => [
              { text: `${event.type}, ${event.date}`, callback_data: `EVENT_${event.id}_${value}` },
            ])
            reply_markup.inline_keyboard.push([
              { text: "Назад", callback_data: 'getCities' },
            ])
            text = "Текст про список ивентов"
            break;
          }
          case 'EVENT': {
            const event = await eventsService.getEvent(value);
            const state = stateStr ? stateStr.split(',') : event.tickets.map(() => 0);
            state.push(0, 0)
            reply_markup.inline_keyboard = event.tickets.reduce((rows, ticket) => {
              rows.push([
                { text: `${config.ticketTypes[ticket.type.toString()] || 'Какой-то билет'}, ${ticket.priceVND}.000 VND/${ticket.priceRub} руб`, callback_data: `TICKET_${ticket.type}` }
              ])
              rows.push([
                { text: '➖', callback_data: `DECR_${value}_${ticket.type}_${state.join(',')}` },
                { text: state[ticket.type], callback_data: "NOTHING" },
                { text: '➕', callback_data: `INCR_${value}_${ticket.type}_${state.join(',')}` }
              ])
              return rows;
            }, [])

            reply_markup.inline_keyboard.push([
              { text: "Назад", callback_data: `CITY_${context}` },
            ])
            text = "Текст про список билетов"
            break;
          }
          case 'INCR': {
            const event = await eventsService.getEvent(value);
            const state = stateStr ? stateStr.split(',').map(Number) : event.tickets.map(() => 0);
            const eventType = Number(context);
            state[eventType] = state[eventType] + 1;
            reply_markup.inline_keyboard.filter(row => row.length === 3).forEach((row, index) => {
              row[0].callback_data = `DECR_${value}_${index}_${state.join(',')}`;
              row[1].text = state[index];
              row[2].callback_data = `INCR_${value}_${index}_${state.join(',')}`;
            });
            const backButton = reply_markup.inline_keyboard[reply_markup.inline_keyboard.length - 1];
            const [totalVND, totalRub] = event.tickets.reduce((res, ticket) => {
              res[0] += state[ticket.type] * ticket.priceVND;
              res[1] += state[ticket.type] * ticket.priceRub;
              return res;
            }, [0, 0]);
            reply_markup.inline_keyboard.length = event.tickets.length * 2;
            if (totalVND > 0) {
              reply_markup.inline_keyboard.push([
                { text: `Купить за ${totalVND}.000 VND`, callback_data: `VND_${value}_${totalVND}_${state.join(',')}` },
              ])
              reply_markup.inline_keyboard.push([
                { text: `Купить за ${totalRub} руб`, callback_data: `RUB_${value}_${totalRub}_${state.join(',')}` },
              ])
            }
            reply_markup.inline_keyboard.push(backButton)
            text += "\u200B";
            break;
          }
          case 'DECR': {
            const event = await eventsService.getEvent(value);
            const state = stateStr ? stateStr.split(',').map(Number) : event.tickets.map(() => 0);
            const eventType = Number(context);
            if (state[eventType] > 0) {
              state[eventType] = state[eventType] - 1;
            }
            reply_markup.inline_keyboard.filter(row => row.length === 3).forEach((row, index) => {
              row[0].callback_data = `DECR_${value}_${index}_${state.join(',')}`;
              row[1].text = state[index];
              row[2].callback_data = `INCR_${value}_${index}_${state.join(',')}`;
            });
            const backButton = reply_markup.inline_keyboard[reply_markup.inline_keyboard.length - 1];
            const [totalVND, totalRub] = event.tickets.reduce((res, ticket) => {
              res[0] += state[ticket.type] * ticket.priceVND;
              res[1] += state[ticket.type] * ticket.priceRub;
              return res;
            }, [0, 0]);
            reply_markup.inline_keyboard.length = event.tickets.length * 2;
            if (totalVND > 0) {
              reply_markup.inline_keyboard.push([
                { text: `Купить за ${totalVND}.000 VND`, callback_data: `VND_${value}_${totalVND}_${state.join(',')}` },
              ])
              reply_markup.inline_keyboard.push([
                { text: `Купить за ${totalRub} руб`, callback_data: `RUB_${value}_${totalRub}_${state.join(',')}` },
              ])
            }
            reply_markup.inline_keyboard.push(backButton)
            text += "\u200B";
            break;
          }
          case 'VND': {
            const event = await eventsService.getEvent(value);
            const state = stateStr ? stateStr.split(',').map(Number) : event.tickets.map(() => 0);
            const amount = Number(context);
            const backButton = reply_markup.inline_keyboard[reply_markup.inline_keyboard.length - 1];
            reply_markup.inline_keyboard = [backButton];
            text += "\u200B";
            await axios.post(`${config.tgApiUrl}/sendPhoto`, {
              chat_id,
              photo: 'https://www.dropbox.com/scl/fi/2mg82u8ijul2lypcrjg2f/476246033_17959642448890365_3285800817416688546_n.jpg?rlkey=5jz9kq568fshixcnzb1la2fpz&dl=0',
              caption: `Оплатите ${amount}.000 VND по этому QR и пришлите скан квитанции`,
              reply_markup,
            });
            break;
          }
          case 'RUB': {
            const event = await eventsService.getEvent(value);
            const state = stateStr ? stateStr.split(',').map(Number) : event.tickets.map(() => 0);
            const amount = Number(context);
            const backButton = reply_markup.inline_keyboard[reply_markup.inline_keyboard.length - 1];
            reply_markup.inline_keyboard = [backButton];
            text += "\u200B";
            await axios.post(`${config.tgApiUrl}/sendMessage`, {
              chat_id,
              text: `Оплатите ${amount} руб. по по номеру 8-912-669-7190`,
              reply_markup,
            });
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
