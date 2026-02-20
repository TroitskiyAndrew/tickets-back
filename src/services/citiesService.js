const { ObjectId } = require("mongodb");
const dataService = require("./mongodb");
const eventsService = require("./eventsService");

const citiesCache = [];

async function getCities() {
    if (citiesCache.length) {
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

async function saveVisit(user, city = '') {
    const userId = user.id;
    let visit  = await dataService.getDocumentByQuery('user', { userId });
    let save = false;
    if(!visit) {
        visit = await dataService.createDocument('user', {pressedStart: false, cities: []})
    }
    if(city && !visit.cities.includes(city)) {
        save = true;
        visit.cities.push(city)
    }
    if(save){
        await dataService.updateDocument('user', visit);
    }
}

async function pressedStart(userId) {
    let visit  = await dataService.getDocumentByQuery('user', { userId });
    if(!visit.pressedStart){
        visit.pressedStart = true;
        await dataService.updateDocument('user', visit);
    }
}



module.exports = {
    getCities: getCities,
    saveVisit: saveVisit,
    pressedStart: pressedStart,
};