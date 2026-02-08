const { ObjectId } = require("mongodb");
const dataService = require("./mongodb");
const socketService = require("./socketService");


async function getEventsByCity(city) {
    const events =  await dataService.getDocuments('event', {city});
    events.forEach(event => event.tickets[0].priceVND = 0);
    for (const event of events){
        await dataService.updateDocument('event', event)

    }
    return events;
}
async function getEvents() {
    const events =  await dataService.getDocuments('event', {});
    return events;
}

async function getEvent(id) {
    const event =  await dataService.getDocument('event', id);    
    return event;
}



module.exports = {
    getEvents: getEvents,
    getEvent: getEvent,
    getEventsByCity: getEventsByCity,
};