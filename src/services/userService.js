
const dataService = require("./mongodb");
const utils = require("../services/utils");

async function handleUser(user, options) {
    const { city, pressedStart, source, sessionId, event } = options;
   // console.log('handleUser', user, source, sessionId)
    let dbUser;
    let save = false;
    if (user) {
        const userId = user.id;
        dbUser = await dataService.getDocumentByQuery('user', { userId });
        if (!dbUser?.userId) {
            console.log('hasUser',user, dbUser)
            dbUser = await dataService.createDocument('user', { user, userId, pressedStart: false, visits: [], path: [], source: source || '', sessionId, _created: utils.getDate(Date.now() + 7 * 60 * 60 * 1000) })
        }
        if (sessionId) {
            const userBySession = await dataService.getDocumentByQuery('user', { sessionId, userId: 0 });
            console.log(userBySession)
            if (userBySession?.sessionId) {
                save = true;
                dbUser.source = userBySession.source;
                dbUser.sessionId = sessionId;
                dbUser.path = [...userBySession.path, ...dbUser.path];
                await dataService.deleteDocumentByQuery('user', { sessionId, userId: 0 });
            }
        }
    } else if(sessionId) {
        dbUser = await dataService.getDocumentByQuery('user', { sessionId, userId: 0 });
        if (!dbUser?.sessionId) {
            console.log('hasSessionId',sessionId, dbUser)
            dbUser = await dataService.createDocument('user', { user: {}, userId: 0, pressedStart: false, visits: [], path: [], source: source || '', sessionId, _created: utils.getDate(Date.now() + 7 * 60 * 60 * 1000) })
        }
    }
    if (source) {
        save = true;
        dbUser.path.push(source);
        if (!dbUser.source){
            dbUser.source = source
        }
    }
    if (city && !dbUser.visits.includes(city)) {
        save = true;
        dbUser.visits.push(city)
    }
    if(event){
        const lastPoint = dbUser.path[dbUser.path.length -1];
        save = true;
        if(event !== lastPoint){
            dbUser.path.push(event);
        }
    }
    if (pressedStart && !dbUser.pressedStart) {
        save = true;
        dbUser.pressedStart = true;
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
        if (user.user.username) {
            name += name ? '(' + user.user.username + ')' : user.user.username;
        }
        return {
            name,
            userId: user.userId
        }
    });
}


module.exports = {
    handleUser: handleUser,
    findUsers: findUsers,
};
