const dataService = require("../services/mongodb");
const { ObjectId } = require("mongodb");
const userService = require("../services/userService");
const sharesService = require("../services/sharesService");
const roomsService = require("../services/roomsService");
const socketService = require("../services/socketService");


const getUser = async (req, res) => {
  try {
    const user = await dataService.getDocumentByQuery("user", {userId:  Number(req.params.userId)});
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
    const {city} = req.body;
    const { user } = req.telegramData;
    await userService.saveVisit(user, {city})
    res.status(200).send(true);
    return;
  } catch (error) {
    console.log(error)
    res.status(500).send(error);
    return;
  }
};

module.exports = {
  getUser: getUser,
  saveVisitToCity: saveVisitToCity,
};
