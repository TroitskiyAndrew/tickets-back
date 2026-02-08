const { ObjectId } = require("mongodb");
const dataService = require("./mongodb");
const socketService = require("./socketService");


async function getEventsByCity(city) {
    const events =  await dataService.getDocuments('event', {city});
    return events;
}
async function getEvents() {
    const events =  await dataService.getDocuments('event', {});
    return events;
}



module.exports = {
    getEvents: getEvents,
    getEventsByCity: getEventsByCity,
};