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

async function saveVisit(userId, city = '') {

    const visits = await dataService.getDocuments('visits', {userId});
    if(visits.length > 0 && !city){
        return;
    }
    const emptyVisit = visits.find(visit => !visit.city);
    if(city && emptyVisit){
        await dataService.deleteDocument('visits', emptyVisit.id);
    }
    const existVisit = visits.find(visit => visit.city === city);
    if(!existVisit){
        await dataService.createDocument('visits', {userId, city})
    }
}



module.exports = {
    getCities: getCities,
    saveVisit: saveVisit,
};