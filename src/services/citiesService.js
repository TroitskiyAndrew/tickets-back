const { ObjectId } = require("mongodb");
const dataService = require("./mongodb");
const eventsService = require("./eventsService");

const citiesCache = [];
const usersCache = new Map()

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
    dbUser = usersCache.get(user.id);
    if(!dbUser) {
        dbUser  = await dataService.getDocumentByQuery('user', { userId });
    }
    let save = false;
    if(!dbUser) {
        dbUser = await dataService.createDocument('user', {user, userId, pressedStart: false, visits: []})
    } 
    if(!dbUser.user) {
        dbUser.user = user;
        
    }
    if(!dbUser.visits) {
        dbUser.user = visits;
    }
    if(city && !dbUser.visits.includes(city)) {
        save = true;
        dbUser.visits.push(city)
    }
    if(save){
        await dataService.updateDocument('user', dbUser);
    }
}

async function pressedStart(userId) {
    let user  = await dataService.getDocumentByQuery('user', { userId });
    if(user) {
        if(!user.pressedStart){
            user.pressedStart = true;
            await dataService.updateDocument('user', user);
        }
    } else {
        await dataService.createDocument('user', { userId, pressedStart: true })
    }
}



module.exports = {
    getCities: getCities,
    saveVisit: saveVisit,
    pressedStart: pressedStart,
};