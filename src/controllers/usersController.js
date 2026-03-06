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
    //     $lookup: {
    //       from: "ticket",
    //       let: { userId: "$userId" },
    //       pipeline: [
    //         {
    //           $match: {
    //             $expr: {
    //               $and: [
    //                 { $eq: ["$userId", "$$userId"] },
    //                 {
    //                   $in: [
    //                     "$event",
    //                     [
    //                       "6985e0b63677bfc5bc8757c3",
    //                       "6985e0b63677bfc5bc8757c4"
    //                     ]
    //                   ]
    //                 }
    //               ]
    //             }
    //           }
    //         },
    //         { $limit: 1 } // достаточно одного билета
    //       ],
    //       as: "matchedTickets"
    //     }
    //   },
    //   {
    //     $match: {
    //       matchedTickets: { $ne: [] }
    //     }
    //   },
    //   {
    //     $project: {
    //       matchedTickets: 0
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
    //       photo: 'https://www.dropbox.com/scl/fi/pfxe9l923hal1imq5lhq9/what.jpg?rlkey=9vk13epfpfnont2jcjq90z8oi&raw=1',
    //       caption: `Я к тебе с хорошей новостью. Мы снизили цены на билеты\nЕсли хочешь - вернем тебе часть денег или оформим депозит на баре 😉\nПлюс, персональная скидка 30% на второе шоу\nнапиши в чат с ботом, чтобы связаться с нами`,
    //       reply_markup: {
    //         inline_keyboard: [
    //           [
    //             { text: "Новые цены на Стендап-концерт 06.03 20:00", url: 'https://t.me/sverlov_vietnam_2026_bot?startapp=SOURCE_SPLIT_PRICE-LOW-NOTICE_SEP_EVENT_SPLIT_6985e0b63677bfc5bc8757c3' },
    //           ],
    //           [
    //             { text: "Новые цены на Шоу-Импровизация 08.03 20:00", url: 'https://t.me/sverlov_vietnam_2026_bot?startapp=SOURCE_SPLIT_PRICE-LOW-NOTICE_SEP_EVENT_SPLIT_6985e0b63677bfc5bc8757c4' },
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

    //     const users = await dataService.aggregate('user', [
    //   {
    //     // 1️⃣ Сначала отфильтруем по visits (использует индекс)
    //     $match: {
    //       visits: "6984920343c748577e5f8704"
    //     }
    //   },
    //   {
    //     // 2️⃣ Проверяем отсутствие нужных билетов
    //     $lookup: {
    //       from: "ticket",
    //       let: { userId: "$userId" },
    //       pipeline: [
    //         {
    //           $match: {
    //             $expr: {
    //               $and: [
    //                 { $eq: ["$userId", "$$userId"] },
    //                 {
    //                   $in: [
    //                     "$event",
    //                     [
    //                       "6985e0b63677bfc5bc8757c3",
    //                       "6985e0b63677bfc5bc8757c4"
    //                     ]
    //                   ]
    //                 }
    //               ]
    //             }
    //           }
    //         },
    //         { $limit: 1 } // достаточно одного совпадения
    //       ],
    //       as: "matchedTickets"
    //     }
    //   },
    //   {
    //     // 3️⃣ Оставляем только тех, у кого таких билетов нет
    //     $match: {
    //       matchedTickets: { $eq: [] }
    //     }
    //   },
    //   {
    //     $project: {
    //       matchedTickets: 0
    //     }
    //   }
    // ])
    //     const ids = users.map(user => user.userId).filter(id => id !== 140779820);
    //     console.log('ids', ids.length)
    //     const success = [];
    //     const fail = [];
    //     const mapLink = `<a href="https://www.instagram.com/sverlovsk">@sverlovsk</a>`;
    //     for (const id of ids) {
    //       try {
    //         await axios.post(`${config.tgApiUrl}/sendPhoto`, {
    //           chat_id: id,
    //           parse_mode: 'HTML',
    //           photo: 'https://www.dropbox.com/scl/fi/pfxe9l923hal1imq5lhq9/what.jpg?rlkey=9vk13epfpfnont2jcjq90z8oi&raw=1',
    //           caption: `Я к тебе с хорошей новостью - цены на билеты в Муйне снизились\nУспевай купить, пока не разобрали`,
    //           reply_markup: {
    //             inline_keyboard: [
    //               [
    //                 { text: "Новые цены на Стендап-концерт 06.03 20:00", url: 'https://t.me/sverlov_vietnam_2026_bot?startapp=SOURCE_SPLIT_PRICE-LOW-NOTICE_SEP_EVENT_SPLIT_6985e0b63677bfc5bc8757c3' },
    //               ],
    //               [
    //                 { text: "Новые цены на Шоу-Импровизация 08.03 20:00", url: 'https://t.me/sverlov_vietnam_2026_bot?startapp=SOURCE_SPLIT_PRICE-LOW-NOTICE_SEP_EVENT_SPLIT_6985e0b63677bfc5bc8757c4' },
    //               ]
    //             ]
    //           },
    //         });
    //         console.log('sent to ', id)
    //         success.push(id)

    //       } catch (error) {
    //         console.log(error)
    //         fail.push(id)
    //       }
    //     }
    //     console.log('success', success.length)
    //     console.log('fail', fail.length)

    // await ticketsService.sendTickets({bookingId: 'OQUo6-HWAjPN-g'})
    // await dataService.updateDocuments('user', {}, {$set: {sessionId: 'OldUser'}});

    // const sources = ['AFISHA',
    //   'BOT-AFISHA-RECALL',
    //   'CONCERT',
    //   'FACEBOOK',
    //   'FLAERS',
    //   'KAIFUSHNIKI',
    //   'KVIZDA-2',
    //   'KVIZDA-3',
    //   'KVIZDATUE-LUDI',
    //   'NHA-TRANG-EVENTS',
    //   'NHA-TRANG-SOURCE-1',
    //   'NHA-TRANG-SOURCE-2',
    //   'NHA-TRANG-SOURCE-8',
    //   'NHA-TRANG-TUSA',
    //   'NORTH-PEOPLE',
    //   'PRICE-LOW-NOTICE',
    //   'RECALL',
    //   'RECALL-2',
    //   'RECALL-3',
    //   'VIETHELPER',
    //   'all-tour',
    //   'mui-ne',
    //   'mui_ne',
    //   'muine',
    //   'muine-facebook',
    //   'muine-flaer-3',
    //   'muine-flaer-5',
    //   'muine-sticker',
    //   'muine-tg-chat-1',
    //   'muine-tg-chat-12',
    //   'muine-tg-chat-14',
    //   'muine-tg-chat-15',
    //   'muine-tg-chat-16',
    //   'muine-tg-chat-18',
    //   'muine-tg-chat-19',
    //   'muine-tg-chat-2',
    //   'muine-tg-chat-22',
    //   'muine-tg-chat-24',
    //   'muine-tg-chat-3',
    //   'muine-tg-chat-6',
    //   'muine-tg-chat-7',
    //   'muine-tg-chat-8',
    //   'phu-quoc',
    //   'phuquoc',
    //   'test3',
    //   'tour',
    //   'unknown'
    // ]
    // const users = await dataService.getDocuments('user', {'path.0': "scroll reels"});
    // for (const user of users) {
    //   user.path = ['unknown', ...user.path];
    //   await dataService.updateDocument('user', user)
    // }

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

