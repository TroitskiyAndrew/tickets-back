const { ObjectId } = require("mongodb");
const dataService = require("./mongodb");
const socketService = require("./socketService");


async function getEvents(city) {
    const allEvents = await dataService.getDocuments('event', {});
    const places =  await dataService.getDocuments('place', {});
    for (const event of allEvents){
        const place = places.find(place => place.id === event.place);
        event.city = place.city;
        await dataService.updateDocument('event',event)
    }
    const events =  await dataService.getDocuments('event', {city});
    return events;
}



module.exports = {
    getEvents: getEvents,
};