
const dataService = require("./mongodb");
const utils = require("../services/utils");

async function saveVisit(user, options) {
    const { city, pressedStart } = options;
    if (!user) {
        console.log('__Не было юзера__')
        return;
    }
    const userId = user.id;
    let save = false;
    let dbUser = await dataService.getDocumentByQuery('user', { userId })
    if (!dbUser?.userId) {
        dbUser = await dataService.createDocument('user', { user, userId, pressedStart: false, visits: [], _created: utils.getDate(Date.now() + 7*60*60*100) })
    }
    if(!dbUser.visits){
        dbUser.visits = dbUser.visits;
    }
    if (city && !dbUser.visits.includes(city)) {
        save = true;
        dbUser.visits.push(city)
    }
    if (pressedStart && !dbUser.pressedStart) {
        save = true;
        dbUser.pressedStart = true;
    }
    if (save) {
        await dataService.updateDocument('user', dbUser);
    }
}

async function saveSource(user, source) {
    if (!user) {
        console.log('__Не было юзера__')
        return;
    }
    const userId = user.id;
    let save = false;
    let dbUser = await dataService.getDocumentByQuery('user', { userId })
    if (!dbUser?.userId) {
        dbUser = await dataService.createDocument('user', { user, userId, pressedStart: false, visits: [], source, _created: utils.getDate(Date.now() + 7*60*60*100) })
    }
    if (source) {
        save = true;
        dbUser.source = source;
    }
    if (save) {
        await dataService.updateDocument('user', dbUser);
    }
}

async function findUsers(query = '') {
    const users = await dataService.getDocuments('user', {
        $or: [
            { "user.first_name": { $regex: query, $options: "i" } },
            { "user.last_name": { $regex: query, $options: "i" } },
            { "user.username": { $regex: query, $options: "i" } }
        ]
    });
    
    return (users || []).map(user => {
        const hasName = user.user.first_name || user.user.last_name;
        let name = hasName ? [user.user.first_name, user.user.last_name].filter(Boolean).join(' ') : '';
        if(user.user.username) {
            name += name ? '(' + user.user.username + ')' : user.user.username;
        }
        return {
            name,
            userId: user.userId
        }
    });
}


module.exports = {
    saveVisit: saveVisit,
    saveSource: saveSource,
    findUsers: findUsers,
};