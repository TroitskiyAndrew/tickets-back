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
    // const user = { id: 480144364, first_name: 'Test', username:'alevtina_psychologist'  };
    //  const userLink = `<a href="https://t.me/${user.username}">${user.first_name || user.username || 'Пользователь'}</a>`;
    // await axios.post(`${config.tgApiUrl}/sendMessage`, {
    //   chat_id: 480144364,
    //   parse_mode: 'HTML',
    //   text: `Сообщение от ${userLink}`,
    // });
    // await dataService.updateDocuments('event', {}, {$set: {entrance: [480144364,692369447,140779820]}})


    // const users = await dataService.aggregate('user', [
    //   {
    //     $match: {
    //       visits: "6984920343c748577e5f8704"
    //     }
    //   },
    //   {
    //     $lookup: {
    //       from: "ticket",
    //       let: { uid: "$userId" },
    //       pipeline: [
    //         {
    //           $match: {
    //             $expr: {
    //               $and: [
    //                 { $eq: ["$userId", "$$uid"] },
    //                 { $eq: ["$event", "6985e0b63677bfc5bc8757c3"] }
    //               ]
    //             }
    //           }
    //         },
    //         { $limit: 1 }
    //       ],
    //       as: "tickets"
    //     }
    //   },
    //   {
    //     $match: {
    //       tickets: { $eq: [] }
    //     }
    //   },
    //   {
    //     $project: {
    //       tickets: 0
    //     }
    //   }
    // ])
    // const ids = users.map(user => user.userId).filter(id => id !== 140779820);
    // console.log('ids', ids.length)
    // const success = [];
    // const fail = [];
    // const mapLink = `<a href="https://www.instagram.com/sverlovsk">@sverlovsk</a>`;
    // for (const id of ids) {
    //   try {
    //     await axios.post(`${config.tgApiUrl}/sendPhoto`, {
    //       chat_id: id,
    //       parse_mode: 'HTML',
    //       photo: 'https://www.dropbox.com/scl/fi/apchcqxxw0q07cnj4ht4x/photo_2026-03-03_01-02-40.jpg?rlkey=rql3yov33n9xsz7age9y8gvlf&raw=1',
    //       caption: `Чего ждем? Стендап концерт в Муйне уже сегодня, бери билеты пока не разобрали!`,
    //       reply_markup: {
    //         inline_keyboard: [
    //           [
    //             { text: "Посмотреть билеты", url: 'https://t.me/sverlov_vietnam_2026_bot?startapp=SOURCE_SPLIT_MUINE-RECALL_SEP_EVENT_SPLIT_6985e0b63677bfc5bc8757c3' },
    //           ]
    //         ]
    //       },
    //     });
    //     console.log('sent to ', id)
    //     success.push(id)

    //   } catch (error) {
    //     console.log(error)
    //     fail.push(id)
    //   }
    // }
    // console.log('success', success.length)
    // console.log('fail', fail.length)

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

