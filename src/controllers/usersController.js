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
    $match: {
      visits: "698491fa43c748577e5f8703"
    }
  },
  {
    $lookup: {
      from: "ticket",
      let: { uid: "$userId" },
      pipeline: [
        {
          $match: {
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
      ticketMatch: { $eq: [] }
    }
  }
]
    const users = await dataService.aggregate('user',aggregation)
    const ids = users.map(user => user.userId).filter(id => id !== 140779820);
    console.log('ids', ids.length)
    const success = [];
    const fail = [];
    const mapLink = `<a href="https://www.instagram.com/sverlovsk">@sverlovsk</a>`;
    for (const id of ids) {
      try {
        await axios.post(`${config.tgApiUrl}/sendPhoto`, {
          chat_id: id,
          parse_mode: 'HTML',
          photo: 'https://www.dropbox.com/scl/fi/pm27zzaz53sdm9g5w8soq/photo_2026-03-18_14-03-35.jpg?rlkey=vvvj2fcarpa8ltrc3xcotew0v&raw=1',
          caption: `Это я смотрю на вас, как вы думаете, брать билеты или нет.\nОбращайтесь к моему организатору @s_gruzdova, у нее для вас скидка на билет аж 30%! Жду всех на шоу.`,
          // reply_markup: {
          //   inline_keyboard: [
          //     [
          //       { text: "Билеты со скидкой 20%", url: 'https://t.me/sverlov_vietnam_2026_bot?startapp=SOURCE_SPLIT_FUKUOK-LAST-CALL-DISCOUNT_SEP_EVENT_SPLIT_6985e0b63677bfc5bc8757c6_SEP_DISCOUNT_SPLIT_6985e0b63677bfc5bc8757c6_D_FUKUOK-LAST-CALL' },
          //     ]
          //   ]
          // },
        });
        console.log('sent to ', id)
        success.push(id)

      } catch (error) {
        console.log(error)
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

