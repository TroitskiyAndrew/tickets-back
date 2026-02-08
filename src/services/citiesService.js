const { ObjectId } = require("mongodb");
const dataService = require("./mongodb");
const socketService = require("./socketService");


async function getCities() {
    const cities = await dataService.getDocuments('city', {})
    return cities;
}



module.exports = {
    getCities: getCities,
};