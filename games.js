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
        var games = connectionMgr.connect('lyingman').get('games');
        //handle change seat
        games.findOneAndUpdate({
            isOver: false,
            room: roomID,
            'players.openid': userInfo.openid
        }, {
                $set: {
                    'players.$.openid': '',
                    'players.$.nickname': '',
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
                            'players.$.nickname': userInfo.nickname,
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
    var players = [];
    if (game.next === 'sit down' || game.next === 'check role') {
        players = game.players.map(function(value, index, array) {
            return {
                seat: value.seat,
                nickname: value.nickname,
                avatarUrl: value.avatarUrl,
                openid: value.openid,
                role: '' //TODO, return the role only if it's necessary
            }
        })
    }
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
        $set: {
            next: 'night 1'
        },
        $inc: {
            day: 1
        }
    }).then(function(doc) {
        io.to(doc.room).emit('update', getStatus(game, socket));
        setTimeout(thiefPickRoles, 3000, game, socket);
    })
}

function thiefPickRoles(game, socket) {
    if (!hasRole(game.roles, 'thief')) return cupidPickLovers(game, socket);
    console.log("thief1222222222222");
}

function cupidPickLovers(game, socket) {
    // TODO, only it's the first day
    if (!hasRole(game.roles, 'cupid')) return magicianSwitchPlayers(game, socket);
}

function magicianSwitchPlayers(game, socket) {
    if (!hasRole(game.roles, 'magician')) return magicianSwitchPlayers(game, socket);
}