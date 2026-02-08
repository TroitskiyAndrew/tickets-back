const dataService = require("../services/mongodb");
const citiesService = require("../services/citiesService");
const roomsService = require("../services/roomsService");
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
      const cq = update.callback_query;
      const data = cq.data;
      const chat_id = cq.message.chat.id;
      const reply_markup = cq.message.reply_markup;
      const [action, value] = data.split('=');
      console.log('cq.from.id', cq.from.id)
      // const isAdmin = config.admins.includes(cq.message.form.id.toString())
      let text = cq.message.text;
      if (data === 'getCities') {
        const cities = await citiesService.getCities();
        console.log(cities[0]);
        console.log(isAdmin)
        reply_markup.inline_keyboard = cities.map((city, i) => [
          { text: city.name, callback_data: `CITY_${i}` },
        ])
        text = "Текст про список городов"
      } else {
        const [action, value] = data.split('_');
        switch (action) {
          case 'getCities': {
            const cities = await citiesService.getCities();
            break;
          }
          default:
            break;
        }
      }

      await axios.post(`${config.tgApiUrl}/editMessageText`, {
        chat_id,
        message_id: cq.message.message_id,
        text: text,
        reply_markup,
      });

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
    console.log(update)


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
