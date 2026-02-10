const { ObjectId } = require("mongodb");
const dataService = require("./mongodb");
const socketService = require("./socketService");

const eventsCache = [];

async function getEventsByCity(city) {
    const events =  await getEvents();
    return events.filter(event => event.city === city);
}
async function getEvents() {
    if( eventsCache.length){
        return eventsCache;
    }
    const events =  await dataService.getDocuments('event', {});
    eventsCache.push(...events);
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