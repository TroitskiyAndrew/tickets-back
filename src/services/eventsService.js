const { ObjectId } = require("mongodb");
const dataService = require("./mongodb");
const socketService = require("./socketService");


async function getEvents(city) {
    const events = await dataService.getDocuments('event', {});
    const places =  await dataService.getDocuments('place', {});
    for (const event of events){
        const place = places.find(place => place.id === event.place);
        event.city = place.city;
        await dataService.updateDocument('event',event)
    }
    return events;
}



module.exports = {
    getEvents: getEvents,
};