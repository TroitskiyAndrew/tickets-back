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
    res.sendStatus(200);
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
        const [action, value, context] = data.split('_SPLIT_');
        switch (action) {
          case 'CONFIRM': {
            const tickets = await dataService.getDocuments('ticket', { bookingId: value });
            if(!tickets.length) {
              console.log('___No tickets___', action, value)
              return;
            }
            await dataService.updateDocuments("ticket", { bookingId: value }, { $set: { confirmed: true } });
            reply_markup.inline_keyboard = []
            text = 'Подтверждено: ' + text;
            await axios.post(`${config.tgApiUrl}/sendMessage`, {
              chat_id: tickets[0].userId,
              text: "Йоу-йоу! Мы получили ваши деньги, все четко. Билеты сейчас упадут в чат, плюс ты всегда сможешь найти их в приложении бота. Увидимся на шоу!",
            });
            for (const ticket of tickets) {
              const event = await eventsService.getEvent(ticket.event);
              const place = await dataService.getDocument('place', event.place)
              const link = `${config.ticketUrlBase}${ticket.id}`;
              const qrBuffer = await QRCode.toBuffer(link, {
                type: 'png',
                width: 512,
                margin: 2,
              });
              const form = new FormData();
              form.append('chat_id', ticket.userId);
              form.append('photo', qrBuffer, { filename: 'qr.png' });
              form.append('parse_mode', 'HTML');
              const mapLink = `<a href="t${place.map}">${place.name}</a>`;
              let caption = `Ваш билет на ${config.eventTypes[event.type]} в ${mapLink} ${event.date} ${event.start}`;
              if (ticket.add) {
                caption += `. В билет входит ${ticket.add}`
              }
              form.append('caption', caption);

              await axios.post(`${config.tgApiUrl}/sendPhoto`, form);
            }

            break;
          }
          case 'MARKETING': {
            const tickets = await dataService.getDocuments('ticket', { bookingId: value });
            await dataService.updateDocuments("ticket", { bookingId: value }, { $set: {type: 0, price: 0, confirmed: true } });
            if(!tickets.length) {
              console.log('___No tickets___', action, value)
              return;
            }
            reply_markup.inline_keyboard = []
            text = tickets.length > 1 ? 'Подтверждены бесплатные билеты: ' : 'Подтвержден бесплатный билет: ' + text;
            await axios.post(`${config.tgApiUrl}/sendMessage`, {
              chat_id: tickets[0].userId,
              text: "Билет сейчас упадут в чат, плюс ты всегда сможешь найти их в приложении бота. Увидимся на шоу!",
            });
            for (const ticket of tickets) {
              const event = await eventsService.getEvent(ticket.event);
              const place = await dataService.getDocument('place', event.place)
              const link = `${config.ticketUrlBase}${ticket.id}`;
              const qrBuffer = await QRCode.toBuffer(link, {
                type: 'png',
                width: 512,
                margin: 2,
              });
              const form = new FormData();
              form.append('chat_id', ticket.userId);
              form.append('photo', qrBuffer, { filename: 'qr.png' });
              form.append('parse_mode', 'HTML');
              const mapLink = `<a href="t${place.map}">${place.name}</a>`;
              let caption = `Ваш билет на ${config.eventTypes[event.type]} в ${mapLink} ${event.date} ${event.start}`;
              if (ticket.add) {
                caption += `. В билет входит ${ticket.add}`
              }
              form.append('caption', caption);

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
        const now = Date.now();
        console.log('start', now)
        try {
          await citiesService.saveVisit(message.from, {pressedStart: true});
          await axios.post(`${config.tgApiUrl}/sendPhoto`, {
            chat_id: message.chat.id,
            photo: config.bot,
            caption: 'Жми на старт👇и хватай билеты на легендарные шоу любимого комика', 
            reply_markup: {
              inline_keyboard: [
                [
                  { text: "Старт", web_app: { url: 'https://sverlov-vietnam-2026.com' } },
                ]
              ]
            },
          }, { timeout: 5000 });
        } catch (error) {
          console.log('Error sending welcome message:', error);
        }
        console.log('end', Date.now() - now)
        return;
      } else {
        await axios.post(`${config.tgApiUrl}/forwardMessage`, {
          chat_id: config.cashier,
          from_chat_id: message.chat.id,
          message_id: message.message_id
        });
      }
    }


    // res.json({ ok: true });
  } catch (error) {
    console.log(error)
    res.status(500).send(error);
    return;
  }
};

module.exports = {
  handleWebhook: handleWebhook,
};
