
const dataService = require("./mongodb");

async function saveVisit(user, options) {
    const  {city, pressedStart } = options;
    if(!user){
        console.log('__Не было юзера__')
        return;
    }
    const userId = user.id;
    let save = false;
    let dbUser = await dataService.getDocumentByQuery('user', {userId})
    if(!dbUser) {
        dbUser = await dataService.createDocument('user', {user, userId, pressedStart: false, visits: []})
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



module.exports = {
    saveVisit: saveVisit,
};