const { ObjectId } = require("mongodb");
const dataService = require("./mongodb");
const eventsService = require("./eventsService");


async function getCities() {
    const cities = await dataService.getDocuments('city', {});
    const events = await eventsService.getEvents();
    const eventsMap = events.reduce((map, event) => {
        const events = map.get(event.city) || [];
        events.push(event)
        return map
    }, new Map());
    cities.forEach(city => city.events = eventsMap.get(city.id))
    return cities;
}



module.exports = {
    getCities: getCities,
};