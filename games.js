var assert = require('assert');
var connectionMgr = require('./util');

/**
 * Module exports.
 */

var io = null;
var games = connectionMgr.connect('lyingman').get('games');

module.exports = GameServer;

function GameServer(httpServer) {
    io = require('socket.io')(httpServer);

    io.on('connection', function(socket) {
        // TODO, handle the case when judge is reconnected
        if (!hasRoom(socket.handshake.query)) return socket.disconnect();

        joinRoom(socket);
        playerSitDown(socket);
        startGame(socket);
        thiefDo(socket);
        cupidDo(socket);
        guardDo(socket);
        wolfDo(socket);

        socket.emit('update room', (roomID) => {
            console.log(roomID);
        });

        socket.on('error', function(error) {
            console.error(error);
            console.error(`user ${socket.id} error`);
        });
        socket.on('disconnect', function(reason) {
            console.info(reason);
            // TODO, emit others if judge is disconnected
            console.log(`user ${socket.id} disconnected`);
        });
        socket.on('disconnecting', function(reason) {
            console.info(reason);
            console.log(`user ${socket.id} disconnecting`);
        });
    });
}

/**
 * Join the room and get latest status
 * @param {Object} user the Socket object
 */
function joinRoom(user) {
    console.log(`user ${user.id} joins room ${user.handshake.query.room}`);
    var roomID = parseInt(user.handshake.query.room);
    var games = connectionMgr.connect('lyingman').get('games');
    games.findOne({
        isOver: false,
        room: roomID,
        $or: [
            { next: 'sit down' },
            { 'players.openid': user.handshake.query.openid }
        ]
    }).then(function(doc) {
        if (!doc) throw new Error(`Can't find room ${roomID}`);
        return doc;
    }).then(function(doc) {
        user.join(roomID, function() {
            user.emit('update', getStatus(doc, user));
        })
    }).catch(function(err) {
        user.emit('update', {
            error: err.toString()
        });
    });
    // Add the user as one of the players if it's not full
}

function playerSitDown(socket) {
    socket.on('sit', (seat, userInfo) => {
        if (!userInfo) return;
        var roomID = getRoom(socket);
        console.info(`[${roomID}] player "${userInfo.nickName}" sits in seat ${seat}`);
        var games = connectionMgr.connect('lyingman').get('games');
        //handle change seat
        games.findOneAndUpdate({
            isOver: false,
            room: roomID,
            'players.openid': userInfo.openid
        }, {
                $set: {
                    'players.$.openid': '',
                    'players.$.nickName': '',
                    'players.$.avatarUrl': ''
                }
            }).then(function(doc) {
                assert(userInfo != null);
                return games.findOneAndUpdate({
                    isOver: false,
                    room: roomID,
                    'players.seat': parseInt(seat)
                }, {
                        $set: {
                            'players.$.openid': userInfo.openid,
                            'players.$.nickName': userInfo.nickName,
                            'players.$.avatarUrl': userInfo.avatarUrl
                        }
                    });
            }).then(function(doc) {
                if (!doc) throw new Error(`Can't find room ${roomID}`);
                //update all players in this room
                io.to(roomID).emit('update', getStatus(doc, socket));
            }).catch(function(err) {
                socket.emit('update', {
                    error: err.toString()
                });
            });
    });
}

function startGame(socket) {
    socket.on('start', (room) => {
        if (!room) return;
        var roomID = parseInt(room);
        console.info(`[${roomID}] start`);
        var games = connectionMgr.connect('lyingman').get('games');
        //handle change seat
        games.findOne({
            isOver: false,
            room: roomID
        }).then(function(doc) {
            if (!doc) throw new Error(`Can't find room ${roomID}`);
            doc.players.forEach(function(value, index, array) {
                if (!value.openid) throw new Error(`Not enough players in room ${roomID}`)
            })
            return games.findOneAndUpdate({
                _id: doc._id
            }, {
                $set: assignRoles(doc.roles)
            });
        }).then(function(doc) {
            //update all players in this room
            io.to(doc.room).emit('update', getStatus(doc, socket));
            //TODO, go to the first night n 10 seconds
            setTimeout(closeEyes, 10000, doc, socket);
        }).catch(function(err) {
            socket.emit('update', {
                error: err.toString()
            });
        });
    });
}

function assignRoles(roles) {
    var roles = roles || [];
    if (hasRole(roles, 'thief')) { // add two more villagers if has thief
        roles.push({
            "role": "villager",
            "name": "普通村民",
            "isMutant": false,
            "isGood": true
        }, {
            "role": "villager",
            "name": "普通村民",
            "isMutant": false,
            "isGood": true
        });
    }
    var setQuery = {};
    // random assign role to player
    roles = shuffle(roles);
    if (hasRole(roles, 'thief')) {
        while (!setQuery['options.thief_hidden_roles']) {
            if ((roles[0].isGood || roles[1].isGood) && findRole(roles, 'thief') > 1) break;
            else roles = shuffle(roles);
        }
        setQuery['options.thief_hidden_roles'] = roles.slice(0, 2);
        roles = roles.slice(2);
    }

    roles.forEach(function(value, index, array) {
        setQuery['players.' + index + '.role'] = value.role;
    })

    setQuery['next'] = 'check role';
    console.log(setQuery);
    return setQuery;
}

function findRole(array, role) {
    for (var i=0;i<array.length;i++) {
        if (array[i].role === role)
            return i;
    }
    return -1;
}

function isDead(players, role) {
    for (var i=0;i<players.length;i++) {
        if (players[i].role === role && players[i].isDead)
            return true;
    }
    return false;
}

function hasRole(array, role) {
    return findRole(array, role) > -1;
}

/**
 * The Fisher-Yates (aka Knuth) shuffle for Browser and Node.js
 * Refer to https://bost.ocks.org/mike/shuffle/ 
 * 
 * @param {Array} array 
 */
function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
  
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
  
      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
  
    return array;
}

function getStatus(game, user) {
    var players = game.players.map(function(value, index, array) {
        return {
            seat: value.seat,
            nickName: value.nickName,
            avatarUrl: value.avatarUrl,
            openid: value.openid,
            role: value.role,
            isDead: value.isDead,
            isReveal: false,
            isCouple: false
        }
    });
    return {
        next: game.next,
        players: players,
        roles: getRoleDescription(game.roles)
    }
}

function getRoleDescription(roles) {
    var wolf_number = 0;
    var villager_number = 0;
    var mutant_roles = [];
    var wolf_roles = [];
    (roles || []).forEach(function(value, index, array) {
        if (value.role === 'villager') villager_number++;
        else if (!value.isGood) {
            wolf_number++;
            if (value.role !== 'werewolf') wolf_roles.push(value.name);
        } else {
            mutant_roles.push(value.name);
        }
    });
    return `${villager_number}村民 \n${wolf_number}狼人${wolf_roles.length > 0 ? '(' + wolf_roles.join(',') + ')' : ''} \n${mutant_roles.join(',')}`;
}

/**
 * handshake query looks like below
 * { room: '7231',
     userInfo: '[object Object]',
     openid: 'ocx7i5H6DoT9QS3UJGdv0jVp0dJ0',
     EIO: '3',
     transport: 'polling',
     t: 'MDL4v2K',
     b64: '1' 
    }
 * @param {Object} query 
 */
function hasRoom(query) {
    let room = parseInt(query.room || -1);
    if (isNaN(room) || room < 0 || room > 9999) {
        return false;
    }
    return true;
}

function getRoom(socket) {
    return parseInt(socket.handshake.query.room);
}

function closeEyes(game, socket) {
    games.findOneAndUpdate({
        _id: game._id
    }, {
        $set: { next: 'night' },
        $inc: { day: 1 }
    }).then(function(doc) {
        io.to(doc.room).emit('update', getStatus(doc, socket));
        setTimeout(thiefPickRoles, 3000, doc, socket);
    }).catch(function(err) {
        socket.emit('update', {
            error: err.toString()
        });
    });
}

function thiefPickRoles(game, socket) {
    if (!hasRole(game.roles, 'thief') || game.day !== 1) return cupidPickLovers(game, socket);

    var now = new Date();
    games.findOneAndUpdate({
        _id: game._id
    }, {
        $set: { 
            next: 'night-thief',
            timestamp: now
        }
    }).then(function(doc) {
        io.to(doc.room).emit('update', getStatus(doc, socket), 10000);
        
        // The timeout action in 10 seconds if theif player is disconnected
        setTimeout(function() {
            var newRole = doc.options.thief_hidden_roles[0];
            if (doc.options.thief_hidden_roles[0].isGood) 
                newRole = doc.options.thief_hidden_roles[1];
            thiefPickRoles_end(socket, newRole, now);
        }, 10000);
    }).catch(function(err) {
        socket.emit('update', {
            error: err.toString()
        });
    });
}

function thiefDo(socket) {
    socket.on('thief act', (newRole) => {
        thiefPickRoles_end(socket, newRole);
    });
}

function thiefPickRoles_end(socket, newRole, timestamp) {
    var roomID = getRoom(socket);
    var query = {
        isOver: false,
        room: roomID,
        'players.role': 'thief'
    };
    if (timestamp) {
        query['timestamp'] = timestamp
    }
    games.findOneAndUpdate(query, {
        $set: { 
            next: 'night-thief-end',
            'players.$.role': newRole,
            timestamp: new Date()
        }
    }).then(function(doc) {
        if (!doc) return; // default action handler, need to skip
        assert(newRole != null)
        io.to(doc.room).emit('update', getStatus(doc, socket));
        setTimeout(cupidPickLovers, 3000, doc, socket);
    }).catch(function(err) {
        socket.emit('update', {
            error: err.toString()
        });
    });
}

function cupidPickLovers(game, socket) {
    if (!hasRole(game.roles, 'cupid') || game.day !== 1) return magicianSwitchPlayers(game, socket);

    var now = new Date();
    games.findOneAndUpdate({_id: game._id}, {
        $set: { 
            next: 'night-cupid',
            timestamp: now
        }
    }).then(function(doc) {
        io.to(doc.room).emit('update', getStatus(doc, socket), 30000);
        
        // The timeout action in 30 seconds if cupid player is disconnected
        setTimeout(function() {
            cupidPickLovers_end(socket, [1, 2], now);
        }, 30000);
    }).catch(function(err) {
        socket.emit('update', {
            error: err.toString()
        });
    });
}

function cupidDo(socket) {
    socket.on('cupid act', (lovers) => {
        cupidPickLovers_end(socket, lovers);
    });
}

/**
 * Set the couple
 * 
 * @param {Object} socket 
 * @param {Array} lovers the seat numbers of the couple
 * @param {Date} timestamp (Optional) the timestamp to match
 */
function cupidPickLovers_end(socket, lovers, timestamp) {
    assert(lovers.length === 2 && lovers[0] > 0 && lovers[1] > 0);
    var roomID = getRoom(socket);
    var query = {
        isOver: false,
        room: roomID
    };
    if (timestamp) {
        query['timestamp'] = timestamp
    }
    var set = {
        next: 'night-cupid-end',
        timestamp: new Date()
    };
    // lovers gives the seat numbers of the couple in array
    var couple1 = lovers[0] -1, couple2 = lovers[1] -1;
    set[`players.${couple1}.isCouple`] = true;
    set[`players.${couple2}.isCouple`] = true;
    games.findOneAndUpdate(query, {
        $set: set
    }).then(function(doc) {
        if (!doc) return; // default action handler, need to skip
        io.to(doc.room).emit('update', getStatus(doc, socket));
        setTimeout(checkCoupleRole, 3000, doc, socket);
    }).catch(function(err) {
        socket.emit('update', {
            error: err.toString()
        });
    });
}

function checkCoupleRole(game, socket) {
    games.findOneAndUpdate({_id: game._id}, {
        $set: { 
            next: 'night-cupid-check-role',
            timestamp: new Date()
        }
    }).then(function(doc) {
        io.to(doc.room).emit('update', getStatus(doc, socket));
        // Wait 10 seconds until players check if he/she is one of the couple
        setTimeout(cupidAllCloseEyes, 10000, doc, socket);
    }).catch(function(err) {
        socket.emit('update', {
            error: err.toString()
        });
    });
}

function cupidAllCloseEyes(game, socket) {
    games.findOneAndUpdate({_id: game._id}, {
        $set: { 
            next: 'night-cupid-close-eye',
            timestamp: new Date()
        }
    }).then(function(doc) {
        io.to(doc.room).emit('update', getStatus(doc, socket));
        // Wait 3 seconds then ask the couple to open eye
        setTimeout(coupleOpenEyes, 3000, doc, socket);
    }).catch(function(err) {
        socket.emit('update', {
            error: err.toString()
        });
    });
}

function coupleOpenEyes(game, socket) {
    games.findOneAndUpdate({_id: game._id}, {
        $set: { 
            next: 'night-couple',
            timestamp: new Date()
        }
    }).then(function(doc) {
        io.to(doc.room).emit('update', getStatus(doc, socket));
        // Wait 10 seconds until the couple know each other
        setTimeout(coupleCloseEyes, 10000, doc, socket);
    }).catch(function(err) {
        socket.emit('update', {
            error: err.toString()
        });
    });
}

function coupleCloseEyes(game, socket) {
    games.findOneAndUpdate({_id: game._id}, {
        $set: { 
            next: 'night-couple-end',
            timestamp: new Date()
        }
    }).then(function(doc) {
        io.to(doc.room).emit('update', getStatus(doc, socket));
        // Wait 3 seconds then ask the couple to open eye
        setTimeout(guardProtect, 3000, doc, socket);
    }).catch(function(err) {
        socket.emit('update', {
            error: err.toString()
        });
    });
}

function guardProtect(game, socket) {
    if (!hasRole(game.roles, 'guard')) return werewolfKill(game, socket);
    var now = new Date();
    games.findOneAndUpdate({_id: game._id}, {
        $set: { 
            next: 'night-guard',
            timestamp: now
        }
    }).then(function(doc) {
        io.to(doc.room).emit('update', getStatus(doc, socket));
        // The timeout action in 30 seconds if guard player is disconnected
        setTimeout(guardProtect_end, isDead(doc, 'guard') ? 10000: 30000, socket, {day: doc.day, guard: 0}, now);
    }).catch(function(err) {
        socket.emit('update', {
            error: err.toString()
        });
    });
}

function guardDo(socket) {
    socket.on('guard act', (action) => {
        guardProtect_end(socket, action);
    });
}

/**
 * 
 * @param {Object} socket 
 * @param {Number} action {day: 1, guard: 2} the first day guard the 2nd player
 * @param {Date} timestamp 
 */
function guardProtect_end(socket, action, timestamp) {
    var roomID = getRoom(socket);
    var query = {
        isOver: false,
        room: roomID
    };
    if (timestamp) {
        query['timestamp'] = timestamp
    }
    var set = {
        next: 'night-guard-end',
        timestamp: new Date()
    };
    if (action.guard) {
        set[`history.${action.day}.guard`] = action.guard;
    }
    games.findOneAndUpdate(query, {
        $set: set
    }).then(function(doc) {
        if (!doc) return; // default action handler, need to skip
        io.to(doc.room).emit('update', getStatus(doc, socket));
        setTimeout(werewolfKill, 3000, doc, socket);
    }).catch(function(err) {
        socket.emit('update', {
            error: err.toString()
        });
    });
}

function werewolfKill(game, socket) {
    var now = new Date();
    games.findOneAndUpdate({_id: game._id}, {
        $set: { 
            next: 'night-werewolf',
            timestamp: now
        }
    }).then(function(doc) {
        io.to(doc.room).emit('update', getStatus(doc, socket));
        // The timeout action in 60 seconds if werewolf player is disconnected
        setTimeout(werewolfKill_end, 60000, socket, {day: doc.day, kill: []}, now);
    }).catch(function(err) {
        socket.emit('update', {
            error: err.toString()
        });
    });
}

function wolfDo(socket) {
    socket.on('werewolf act', (kill) => {
        //TODO, handle the kill action from each wolf
        werewolfKill_end(socket, kill);
    });
}

function werewolfKill_end(socket, action, timestamp) {
    var roomID = getRoom(socket);
    var query = {
        isOver: false,
        room: roomID
    };
    if (timestamp) {
        query['timestamp'] = timestamp
    }
    var set = {
        next: 'night-werewolf-end',
        timestamp: new Date()
    };
    set[`history.${action.day}.kill`] = action.kill;
    games.findOneAndUpdate(query, {
        $set: set
    }).then(function(doc) {
        if (!doc) return; // default action handler, need to skip
        //TODO, is game over?
        io.to(doc.room).emit('update', getStatus(doc, socket));
        //TODO, awake witch
        //setTimeout(werewolfKill, 3000, doc, socket);
    }).catch(function(err) {
        socket.emit('update', {
            error: err.toString()
        });
    });
}

function magicianSwitchPlayers(game, socket) {
    if (!hasRole(game.roles, 'magician')) return magicianSwitchPlayers(game, socket);
}