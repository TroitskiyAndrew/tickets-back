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
    await dataService.updateDocuments('event', {}, {$set: {schema: 'https://www.dropbox.com/scl/fi/z29w9zt27ics999tqoyxo/.png?rlkey=pk9dsz6ufjmikfszuwffr220g&dl=0'}})
    await dataService.updateDocuments('place', {}, {$set: {map: 'https://maps.app.goo.gl/65BzsaNqLUEsgMkQ6'}})
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