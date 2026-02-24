const { ObjectId } = require("mongodb");
const dataService = require("./mongodb");
const eventsService = require("./eventsService");
const axios = require("axios");
const config = require("../config/config");

const citiesMap = new Map();

async function getCities() {
    let cities = [...citiesMap.values()];
    if (!cities.length) {
        cities = await dataService.getDocuments('city', {});
    }
    const events = await eventsService.getEvents();
    const eventsMap = events.reduce((map, event) => {
        const events = map.get(event.city) || [];
        events.push(event);
        map.set(event.city, events);
        return map
    }, new Map());
    cities.forEach(city => city.events = eventsMap.get(city.id));
    const sortedCities = cities.sort((a, b) => a.order - b.order);
    // await axios.post(`${config.tgApiUrl}/sendMessage`, {
    //     chat_id: 1213665880,
    //     text: "Доброе утро, наш сотрудник не смог связаться с вами, так как ваш аккаунт в телеграмме скрыт. ПОжалуйста, напишите @s_gruzdova чтобы купить билеты за наличные",
    // });

    return sortedCities;
}

async function getCitiesToCache() {
    const cities = (await dataService.getDocuments('city', {})) || [] ;
    for (const city of cities) {
        citiesMap.set(city.id, city)
    }
}

getCitiesToCache()

module.exports = {
    getCities: getCities,
    citiesMap: citiesMap,
};