const dataService = require("../services/mongodb");
const citiesService = require("../services/citiesService");
const eventsService = require("../services/eventsService");
const QRCode = require("qrcode");
const crypto = require("crypto");
const config = require("../config/config");
const axios = require("axios");
const FormData = require("form-data");
const { ObjectId } = require("mongodb");
const { sendMessage } = require("../services/messageService");

const stateMap = new Map()

const handleWebhook = async (req, res) => {
  try {
    const update = req.body;
    let isAdmin = false;
    // if (update._sendMessage) {
    //   res.json({ ok: true });
    //   console.log(req.body)
    //   sendMessage(req.body.chat_id, req.body.text, req.body.reply_markup)
    //   return;
    // }

    if (update.callback_query) {
      let emptyButton = false;
      const cq = update.callback_query;
      const data = cq.data;
      const chat_id = cq.message.chat.id;
      const reply_markup = cq.message.reply_markup;
      const userId = cq.from.id.toString()
      isAdmin = config.admins.includes(userId)
      let text = cq.message.caption || cq.message.text + "\u200B";
      let newPhoto;
      let responseText;
      if (data === 'getCities') {
        const cities = await citiesService.getCities();
        reply_markup.inline_keyboard = cities.map(city => [
          { text: `${city.name} (${city.events.map(event => event.date).join(', ')})`, callback_data: `CITY_${city.id}` },
        ])
        reply_markup.inline_keyboard.push([
          { text: "Назад", callback_data: `HOME` },
        ])
        text = "Выберите город";
      } else {
        const [action, value, context] = data.split('_');
        switch (action) {
          case 'CITY': {
            const events = await eventsService.getEventsByCity(value);
            reply_markup.inline_keyboard = events.map(event => [
              { text: `${event.type}, ${event.date}`, callback_data: `EVENT_${event.id}` },
            ])
            reply_markup.inline_keyboard.push([
              { text: "Назад", callback_data: 'getCities' },
            ])
            text = "Выберите одно из мероприятий";
            newPhoto = config.mainImage;
            break;
          }
          case 'EVENT': {
            const event = await eventsService.getEvent(value);
            newPhoto = event.schema;
            const state = {
              event: value,
            }
            stateMap.set(userId, state);
            reply_markup.inline_keyboard = event.tickets.filter(ticket => isAdmin || ticket.priceVND > 0).sort((a,b) => b.priceVND - a.priceVND).reduce((rows, ticket) => {
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
              { text: "Назад", callback_data: `CITY_${event.city}` },
            ])
            text = "Выберите билеты"
            break;
          }
          case 'INCR': {
            const event = await eventsService.getEvent(value);
            const state = stateMap.get(userId) || {};
            const bookedTickets = await dataService.getDocuments('ticket', { event: event.id, type: context, confirmed: true });
            const availableTickets = event.tickets.find(ticket => ticket.type === Number(context)).count - bookedTickets.length;
            const currentCount = state[context] || 0;
            if (availableTickets < currentCount) {
              responseText = 'Вы выбрали максимальное доступное кол-во билетов'
            }
            let count = Math.min(currentCount + 1, availableTickets);
            state[context] = count;
            let i = 0
            for (const row of reply_markup.inline_keyboard) {
              if (row.length === 3) {
                i += 2;
                const [action, value, ticketType] = row[0].callback_data.split('_');
                row[1].text = state[ticketType] || 0
              }
            }
            const backButton = reply_markup.inline_keyboard[reply_markup.inline_keyboard.length - 1];
            const [totalVND, totalRub] = event.tickets.reduce((res, ticket) => {
              res[0] += (state[ticket.type.toString()] ?? 0) * ticket.priceVND;
              res[1] += (state[ticket.type.toString()] ?? 0) * ticket.priceRub;
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
            const state = stateMap.get(userId) || {};
            if (!state[context]) {
              emptyButton = true;
              break;
            }
            const bookedTickets = await dataService.getDocuments('ticket', { event: event.id, type: context, confirmed: true });
            const availableTickets = event.tickets.find(ticket => ticket.type === Number(context)).count - bookedTickets.length;
            const currentCount = state[context] || 0;
            let count = Math.min(currentCount - 1, availableTickets);
            state[context] = count;
            let i = 0
            for (const row of reply_markup.inline_keyboard) {
              if (row.length === 3) {
                i += 2;
                const [action, value, ticketType] = row[0].callback_data.split('_');
                row[1].text = state[ticketType] || 0
              }
            }
            const backButton = reply_markup.inline_keyboard[reply_markup.inline_keyboard.length - 1];
            const [totalVND, totalRub] = event.tickets.reduce((res, ticket) => {
              res[0] += (state[ticket.type.toString()] ?? 0) * ticket.priceVND;
              res[1] += (state[ticket.type.toString()] ?? 0) * ticket.priceRub;
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
          case 'VND': {
            const event = await eventsService.getEvent(value);
            const amount = Number(context);
            reply_markup.inline_keyboard = [
              [{ text: `Оплатил`, callback_data: `PAYED_${value}_VND` }],
              [{ text: `Назад`, callback_data: `EVENT_${value}` }],
            ]
            text = `Оплатите ${amount}.000 VND по этому QR, пришлите скрин квитанции, нажмите "Оплатил"`;
            newPhoto = config.vndQR;
            break;
          }
          case 'RUB': {
            const event = await eventsService.getEvent(value);
            const state = stateMap.get(userId) || {};
            const amount = Number(context);
            reply_markup.inline_keyboard = [
              [{ text: `Оплатил`, callback_data: `PAYED_${value}_RUB` }],
              [{ text: `Назад`, callback_data: `EVENT_${value}` }],
            ]
            text = `Оплатите ${amount} руб. ${config.rubAccount}, пришлите скрин квитанции, нажмите "Оплатил"`;
            newPhoto = config.rubQR;
            break;
          }
          case 'PAYED': {
            const event = await eventsService.getEvent(value);
            const state = stateMap.get(userId) || {};
            const bookingId = crypto.randomBytes(10).toString('base64url');
            const tickets = event.tickets.reduce((res, ticket) => {
              const count = state[ticket.type.toString()] || 0;
              if (count > 0) {
                res.push(...Array(count).fill({
                  userId: Number(userId),
                  event: event.id,
                  bookingId,
                  type: ticket.type,
                  currency: context,
                  method: 'bank',
                  price: context === 'VND' ? ticket.priceVND : ticket.priceRub,
                  cashier: config.cashier,
                  confirmed: false,
                }))
              }
              return res;
            }, []);
            await dataService.createDocuments('ticket', tickets);
            text = "Ожидайте подтверждения платежа"
            newPhoto = config.wait;
            reply_markup.inline_keyboard = [
              [
                { text: "На главную", callback_data: "HOME" },
              ]
            ]
            const userLink = `<a href="tg://user?id=${cq.from.id}">${cq.from.first_name || 'Пользователь'}</a>`;
            await axios.post(`${config.tgApiUrl}/sendMessage`, {
              chat_id: config.cashier,
              text: `Оплата от ${userLink} на сумму ${tickets.reduce((acc, ticket) => acc += ticket.price, 0)}${context === 'VND' ? '.000 VND' : ' руб'} за ${tickets.length} билет${tickets.length === 1 ? '' : tickets.length <= 4 ? 'а' : 'ов'} на ${event.date}`,
              parse_mode: 'HTML',
              reply_markup: {
                inline_keyboard: [
                  [{ text: "Подтвердить", callback_data: `CONFIRM_${bookingId}` }],
                  [{ text: "Неправильная сумма", callback_data: `WRONG_${bookingId}` }],
                  [{ text: "Деньги не поступили", callback_data: `DROP_${bookingId}` }],
                ]
              }
            });

            break;
          }
          case 'CONFIRM': {
            const tickets = await dataService.getDocuments('ticket', { bookingId: value });
            await dataService.updateDocuments("ticket", { bookingId: value }, { $set: { confirmed: true } });
            reply_markup.inline_keyboard = []
            text = 'Подтверждено: ' + text;
            for (const ticket of tickets) {
              const event = await eventsService.getEvent(ticket.event);
              const link = `${config.ticketUrlBase}${ticket.id}`;
              const qrBuffer = await QRCode.toBuffer(link, {
                type: 'png',
                width: 512,
                margin: 2,
              });
              const form = new FormData();
              form.append('chat_id', ticket.userId);
              form.append('photo', qrBuffer, { filename: 'qr.png' });
              form.append('caption', `Ваш билет на ${config.eventTypes[event.type]} ${event.date} ${event.start} подтвержден`);

              await axios.post(`${config.tgApiUrl}/sendPhoto`, form);
            }

            break;
          }
          case 'WRONG': {
            const tickets = await dataService.getDocuments('ticket', { bookingId: value });
            await axios.post(`${config.tgApiUrl}/sendMessage`, {
              chat_id: tickets[0].userId,
              text: "Что-то не сошлось по сумме. Напишите сообщение, чтобы уточнить детали",
            });
            break;
          }
          case 'DROP': {
            const tickets = await dataService.getDocuments('ticket', { bookingId: value });
            await axios.post(`${config.tgApiUrl}/sendMessage`, {
              chat_id: tickets[0].userId,
              text: "Менеджер не получил вашу оплату. Напишите сообщение, чтобы уточнить детали",
            });
            reply_markup.inline_keyboard = []
            await dataService.deleteDocumentsByQuery('ticket', { bookingId: value });
            break;
          }
          case 'MY-TICKETS': {
            const tickets = await dataService.getDocuments('ticket', { userId: Number(userId) });
            if(tickets.length === 0){
              responseText = 'У вас еще нет билетов'
            }
            emptyButton = true;
            for (const ticket of tickets) {
              const event = await eventsService.getEvent(ticket.event);
              if (ticket.confirmed) {
                const link = `${config.ticketUrlBase}${ticket.id}`;
                const qrBuffer = await QRCode.toBuffer(link, {
                  type: 'png',
                  width: 512,
                  margin: 2,
                });
                const form = new FormData();
                form.append('chat_id', ticket.userId);
                form.append('photo', qrBuffer, { filename: 'qr.png' });
                form.append('caption', `Ваш билет на ${event.type} ${event.date}`);

                await axios.post(`${config.tgApiUrl}/sendPhoto`, form);
              } else {
                await axios.post(`${config.tgApiUrl}/sendMessage`, {
                  chat_id: ticket.userId,
                  text: `Ваш билет на ${event.type} ${event.date} ожидает подтверждения оплаты`
                });
              }
            }

            break;
          }
          case 'HOME': {
            reply_markup.inline_keyboard = [
              [{ text: "Города тура", callback_data: "getCities" }],
              [{ text: "Мои билеты", callback_data: "MY-TICKETS" },]
            ]
            newPhoto = config.mainImage
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
              caption: text,
              parse_mode: 'HTML'
            },
            reply_markup,
          });

        } else {
          const msg = cq.message;
          const hasPhoto = Array.isArray(msg.photo) && msg.photo.length > 0;
          if (hasPhoto) {
            await axios.post(`${config.tgApiUrl}/editMessageCaption`, {
              chat_id,
              message_id: cq.message.message_id,
              caption: text,
              parse_mode: 'HTML',
              reply_markup,
            });

          } else {
            await axios.post(`${config.tgApiUrl}/editMessageText`, {
              chat_id,
              message_id: cq.message.message_id,
              text,
              parse_mode: 'HTML',
              reply_markup,
            });
          }
        }
      }

      await axios.post(`${config.tgApiUrl}/answerCallbackQuery`, {
        callback_query_id: cq.id,
        text: responseText
      });


    }
    const message = update.message;
    if (message) {
      if (message.text === "/start") {
        await axios.post(`${config.tgApiUrl}/sendMessage`, {
        chat_id: message.chat.id,
        text: "Добро пожаловать!",
        reply_markup: {
          inline_keyboard: [
            [
          {
            text: '🚀 Открыть приложение',
            web_app: { url: 'https://sverlov-vietnam-2026.com' }
          }
        ]
          ]
        },
      });
        return;
      } else {
        await axios.post(`${config.tgApiUrl}/forwardMessage`, {
          chat_id: config.cashier,
          from_chat_id: message.chat.id,
          message_id: message.message_id
        });
      }
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
