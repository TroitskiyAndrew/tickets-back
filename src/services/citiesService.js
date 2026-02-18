const { ObjectId } = require("mongodb");
const dataService = require("./mongodb");
const eventsService = require("./eventsService");

const citiesCache = [];

async function getCities() {
    if(citiesCache.length){
        return citiesCache;
    }
    const cities = await dataService.getDocuments('city', {});
    const events = await eventsService.getEvents();
    const eventsMap = events.reduce((map, event) => {
        const events = map.get(event.city) || [];
        events.push(event);
        map.set(event.city, events);
        return map
    }, new Map());
    cities.forEach(city => city.events = eventsMap.get(city.id));
    const sortedCities = cities.sort((a, b) => a.order - b.order);
    citiesCache.push(...sortedCities)
    return sortedCities;
}



module.exports = {
    getCities: getCities,
};