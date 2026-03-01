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
    const { city } = req.body;
    const { user } = req.telegramData;
    await userService.saveVisit(user, { city })
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
    const { source } = req.body;
    const { user } = req.telegramData;
    await userService.saveSource(user, source)
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
    //                 { $eq: ["$event", "6985e0b43677bfc5bc8757bc"] }
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
    //     await axios.post(`${config.tgApiUrl}/sendMessage`, {
    //       chat_id: id,
    //       parse_mode: 'HTML',
    //       text: `Ну что, как тебе сегодняшнее шоу? Кайфанули?\nОтмечайте ${mapLink} в сторис, он обязательно зарепостит!\nОтзыв можно отправить сообщением в чат, Дима все прочитает`,
    //     });
    //     console.log('sent to ', id)
    //     success.push(id)

    //   } catch (error) {
    //     fail.push(id)
    //   }
    // }
    // console.log('success', success.length)
    // console.log('fail', fail.length)

    // await ticketsService.sendTickets({bookingId: 'OQUo6-HWAjPN-g'})
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
};
