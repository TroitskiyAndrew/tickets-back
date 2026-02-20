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

async function saveVisit(user, options) {
    const  {city, pressedStart } = options;
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
        save = true;
        dbUser.user = user;
    }
    if(!dbUser.visits) {
        save = true;
        dbUser.user = visits;
    }
    if(city && !dbUser.visits.includes(city)) {
        save = true;
        dbUser.visits.push(city)
    }
    if (pressedStart && !dbUser.pressedStart) {
        save = true;
        dbUser.pressedStart = true;
    }
    if(userId === 480144364) {
        console.log('save', save)
        console.log('user', user)
        console.log('dbUser', dbUser)
    }
    if(save){
        await dataService.updateDocument('user', dbUser);
    }
}



module.exports = {
    getCities: getCities,
    saveVisit: saveVisit,
};