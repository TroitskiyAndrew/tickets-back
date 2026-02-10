const dataService = require("../services/mongodb");
const citiesService = require("../services/citiesService");
const eventsService = require("../services/eventsService");
const membersService = require("../services/membersService");
const config = require("../config/config");
const axios = require("axios");
const { ObjectId } = require("mongodb");
const { sendMessage } = require("../services/messageService");

const stateMap = new Map()

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
      let text = cq.message.text + "\u200B";
      let newPhoto;
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
        const [action, value, context] = data.split('_');
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
            const state = {
              event: value,
            }
            stateMap.set(userId, state);
            reply_markup.inline_keyboard = event.tickets.reduce((rows, ticket) => {
              rows.push([
                { text: `${config.ticketTypes[ticket.type.toString()] || 'Какой-то билет'}, ${ticket.priceVND}.000 VND/${ticket.priceRub} руб`, callback_data: `TICKET_${ticket.type}` }
              ])
              rows.push([
                { text: '➖', callback_data: `DECR_${value}_${ticket.type}` },
                { text: 0, callback_data: "NOTHING" },
                { text: '➕', callback_data: `INCR_${value}_${ticket.type}` }
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
            const state = stateMap.get(userId);
            state[context] = (state[context] || 0) + 1;
            let i = 0
            for (const row of reply_markup.inline_keyboard) {
              if(row.length === 3){
                i += 2;
                const [action, value, ticketType] = row[0].callback_data.split('_');
                row[1].text = state[ticketType] || 0
              }
            }
            const backButton = reply_markup.inline_keyboard[reply_markup.inline_keyboard.length - 1];
            const [totalVND, totalRub] = event.tickets.reduce((res, ticket) => {
              res[0] += state[ticket.type] * ticket.priceVND;
              res[1] += state[ticket.type] * ticket.priceRub;
              return res;
            }, [0, 0]);
            reply_markup.inline_keyboard.length = i;
            if (totalVND > 0) {
              reply_markup.inline_keyboard.push([
                { text: `Купить за ${totalVND}.000 VND`, callback_data: `VND_${value}_${totalVND}` },
              ])
              reply_markup.inline_keyboard.push([
                { text: `Купить за ${totalRub} руб`, callback_data: `RUB_${value}_${totalRub}` },
              ])
            }
            reply_markup.inline_keyboard.push(backButton)
            text += "\u200B";
            break;
          }
          case 'DECR': {
            const event = await eventsService.getEvent(value);
            const state = stateMap.get(userId);
            if (!state[context]) {
              emptyButton = true;
              break;
            }
            state[context] = state[context] - 1;
            let i = 0
            for (const row of reply_markup.inline_keyboard) {
              if(row => row.length === 3){
                i += 2;
                const [action, value, ticketType] = row[0].callback_data.split('_');
                row[1].text = state[ticketType] || 0
              }
            }
            const backButton = reply_markup.inline_keyboard[reply_markup.inline_keyboard.length - 1];
            const [totalVND, totalRub] = event.tickets.reduce((res, ticket) => {
              res[0] += state[ticket.type.toString()] * ticket.priceVND;
              res[1] += state[ticket.type.toString()] * ticket.priceRub;
              return res;
            }, [0, 0]);
            reply_markup.inline_keyboard.length = event.tickets.length * 2;
            if (totalVND > 0) {
              reply_markup.inline_keyboard.push([
                { text: `Купить за ${totalVND}.000 VND`, callback_data: `VND_${value}_${totalVND}` },
              ])
              reply_markup.inline_keyboard.push([
                { text: `Купить за ${totalRub} руб`, callback_data: `RUB_${value}_${totalRub}` },
              ])
            }
            reply_markup.inline_keyboard.push(backButton)
            text += "\u200B";
            break;
          }
          case 'VND': {
            const event = await eventsService.getEvent(value);
            const state = stateMap.get(userId);
            const amount = Number(context);
            emptyButton = true;
            await axios.post(`${config.tgApiUrl}/sendPhoto`, {
              chat_id,
              photo: 'https://www.dropbox.com/scl/fi/2mg82u8ijul2lypcrjg2f/476246033_17959642448890365_3285800817416688546_n.jpg?rlkey=5jz9kq568fshixcnzb1la2fpz&dl=0',
              caption: `Оплатите ${amount}.000 VND по этому QR, пришлите скрин квитанции, нажмите "Оплатил"`,
              reply_markup: {
                inline_keyboard: [
                  [{ text: `Оплатил`, callback_data: `PAYED_${value}_VND` }],
                  [{ text: `Назад`, callback_data: `EVENT_${value}_${event.city}` }],
                ]
              },
            });
            break;
          }
          case 'RUB': {
            const event = await eventsService.getEvent(value);
            const state = stateStr ? stateStr.split(',').map(Number) : event.tickets.map(() => 0);
            const amount = Number(context);
            emptyButton = true;
            await axios.post(`${config.tgApiUrl}/sendPhoto`, {
              chat_id,
              photo: 'https://www.dropbox.com/scl/fi/2mg82u8ijul2lypcrjg2f/476246033_17959642448890365_3285800817416688546_n.jpg?rlkey=5jz9kq568fshixcnzb1la2fpz&dl=0',
              caption: `Оплатите ${amount} руб. по по номеру 8-912-669-7190, пришлите скрин квитанции, нажмите "Оплатил"`,
              reply_markup: {
                inline_keyboard: [
                  [{ text: `Оплатил`, callback_data: `PAYED_${value}_RUB` }],
                  [{ text: `Назад`, callback_data: `EVENT_${value}_${event.city}` }],
                ]
              },
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
            emptyButton = true;
            break;
        }
      }
      if (!emptyButton) {
        if (newPhoto) {
          await axios.post(`${config.tgApiUrl}/editMessageMedia`, {
            chat_id,
            message_id: cq.message.message_id,
            media: {
              type: 'photo',
              media: newPhoto,
              caption: text
            },
            reply_markup,
          });

        } else {
          await axios.post(`${config.tgApiUrl}/editMessageCaption`, {
            chat_id,
            message_id: cq.message.message_id,
            caption: text,
            reply_markup,
          });
        }
      }

      await axios.post(`${config.tgApiUrl}/answerCallbackQuery`, {
        callback_query_id: cq.id,
        // text: responseText
      });


    }
    const message = update.message
    if (message && message.text === "/start") {
      await axios.post(`${config.tgApiUrl}/sendPhoto`, {
        chat_id: message.chat.id,
        photo: 'https://www.dropbox.com/scl/fi/2mg82u8ijul2lypcrjg2f/476246033_17959642448890365_3285800817416688546_n.jpg?rlkey=5jz9kq568fshixcnzb1la2fpz&dl=0',
        caption: "Добро пожаловать!",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "Список городов", callback_data: "getCities" },
            ]
          ]
        },
      });
    }
    if (message && message.photo) {
      await axios.post(`${config.tgApiUrl}/forwardMessage`, {
        chat_id: config.cashier,
        from_chat_id: message.chat.id,
        message_id: message.message_id
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
