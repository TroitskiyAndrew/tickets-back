const dataService = require("../services/mongodb");
const { ObjectId } = require("mongodb");
const userService = require("../services/userService");
const sharesService = require("../services/sharesService");
const roomsService = require("../services/roomsService");
const ticketsService = require("../services/ticketsService");
const axios = require("axios");
const config = require("../config/config");


const getUser = async (req, res) => {
  try {
    const user = await dataService.getDocumentByQuery("user", { userId: Number(req.params.userId) });
    res.status(200).send(user);
    return;
  } catch (error) {
    console.log(error)
    res.status(500).send(error);
    return;
  }
};

const saveVisitToCity = async (req, res) => {
  try {
    const { city, sessionId, event } = req.body;
    const { user } = req.telegramData;
    await userService.handleUser(user, { city, sessionId, event });
    res.status(200).send(true);
    return;
  } catch (error) {
    console.log(error)
    res.status(500).send(error);
    return;
  }
};

const saveSource = async (req, res) => {
  try {
    const { source, sessionId } = req.body;
    const { user } = req.telegramData;
    await userService.handleUser(user, { source, sessionId })
    res.status(200).send(true);
    return;
  } catch (error) {
    console.log(error)
    res.status(500).send(error);
    return;
  }
};

const savePath = async (req, res) => {
  try {
    const { pathPoint, sessionId } = req.body;
    const { user } = req.telegramData;
    await userService.handleUser(user, { pathPoint, sessionId })
    res.status(200).send(true);
    return;
  } catch (error) {
    console.log(error)
    res.status(500).send(error);
    return;
  }
};

const findUsers = async (req, res) => {
  try {
    const users = await userService.findUsers(req.params.query)
    res.status(200).send(users);
    return;
  } catch (error) {
    console.log(error)
    res.status(500).send([]);
    return;
  }
};

const sendMessage = async (req, res) => {
  try {
    const andrei = 480144364

    const aggregation = [
      {
        $lookup: {
          from: "ticket",
          let: { uid: "$userId" },
          pipeline: [
            {
              $match: {
                event: "6985e0b53677bfc5bc8757c1",
                $expr: {
                  $eq: ["$userId", "$$uid"]
                }
              }
            },
            { $limit: 1 }
          ],
          as: "ticketMatch"
        }
      },
      {
        $match: {
          "ticketMatch.0": { $exists: true }
        }
      }
    ]
    // const users = await dataService.aggregate('user', aggregation)
    const users = await dataService.getDocuments('user', { userId: { $ne: 0 } })
    const ids = users.map(user => user.userId).filter(id => id !== 140779820);
    console.log('ids', ids.length)
    const success = [];
    const fail = [];
    const mapLink = `<a href="https://www.instagram.com/sverlovsk">@sverlovsk</a>`;
    for (const id of [andrei]) {
      try {
        await axios.post(`${config.tgApiUrl}/sendVideo`, {
          chat_id: id,
          parse_mode: 'HTML',
          video: 'https://dl.dropboxusercontent.com/scl/fi/qkc7ox5smomgyb2cest8d/hoshimin_2.mp4?rlkey=xg7ispr0j735u4uysgtobiml5&dl=1',
          caption: `Хошимин, встречай!
Дима Сверлов в пути.
Увидимся 27 и 28 на шоу Стендап концерт, а 29 на шоу Стендап-нетворкинг.

Выбирай дату, бронируй заранее. Заходи в бот и выбирай места.

На входе 100% будет дороже.
Приобретай заранее, пиши @s_gruzdova, она поможет`,
          // reply_markup: {
          //   inline_keyboard: [
          //     [
          //       { text: "Билеты со скидкой 30%", url: 'https://t.me/sverlov_vietnam_2026_bot?startapp=SOURCE_SPLIT_CONCERT-VUNGTAU_SEP_EVENT_SPLIT_69959c523510f226fed2e819_SEP_DISCOUNT_SPLIT_69959c523510f226fed2e819_D_CONCERT-VUNGTAU' },
          //     ]
          //   ]
          // },
        });
        console.log('sent to ', id)
        success.push(id)

      } catch (error) {
        // console.log(error)
        fail.push(id)
      }
    }
    console.log('success', success.length)
    console.log('fail', fail.length);
    // await ticketsService.sendTickets({ bookingId: 'gKME1wlM5-pHew' })

    res.status(200).send(true);
    return;
  } catch (error) {
    console.log(error)
    res.status(500).send([]);
    return;
  }
};

module.exports = {
  getUser: getUser,
  saveVisitToCity: saveVisitToCity,
  saveSource: saveSource,
  findUsers: findUsers,
  sendMessage: sendMessage,
  savePath: savePath,
};

