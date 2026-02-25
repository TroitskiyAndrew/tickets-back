
const dataService = require("./mongodb");
const utils = require("../services/utils");

async function saveVisit(user, options) {
    const  {city, pressedStart } = options;
    if(!user){
        console.log('__Не было юзера__')
        return;
    }
    const userId = user.id;
    let save = false;
    let dbUser = await dataService.getDocumentByQuery('user', {userId})
    if(!dbUser?.userId) {
        dbUser = await dataService.createDocument('user', {user, userId, pressedStart: false, visits: [], _created: utils.getDate(Date.now())})
    } 
    if(city && !dbUser.visits.includes(city)) {
        save = true;
        dbUser.visits.push(city)
    }
    if (pressedStart && !dbUser.pressedStart) {
        save = true;
        dbUser.pressedStart = true;
    }
    if(save){
        await dataService.updateDocument('user', dbUser);
    }
}

async function saveSource(user, source) {
    if(!user){
        console.log('__Не было юзера__')
        return;
    }
    const userId = user.id;
    let save = false;
    let dbUser = await dataService.getDocumentByQuery('user', {userId})
    if(!dbUser?.userId) {
        dbUser = await dataService.createDocument('user', {user, userId, pressedStart: false, visits: [], source, _created: utils.getDate(Date.now())})
    }
    if(source){
        save = true;
        dbUser.source = source;
    }
    if(save){
        await dataService.updateDocument('user', dbUser);
    }
}



module.exports = {
    saveVisit: saveVisit,
    saveSource: saveSource,
};