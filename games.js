var assert = require('assert');
var connectionMgr = require('./util');

/**
 * Module exports.
 */

var io = null;

module.exports = GameServer;

function GameServer(httpServer) {
    io = require('socket.io')(httpServer);

    io.on('connection', function(socket) {
        if (!hasRoom(socket.handshake.query)) return socket.disconnect();

        joinRoom(socket);
        playerSitDown(socket);

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
            {next: 'sit down'},
            {'players.openid' : user.handshake.query.openid}
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
            assert(userInfo!=null);
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

function getStatus(game, user) {
    var players = [];
    if (game.next === 'sit down') {
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
        next: 'sit down',
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
    return `${villager_number}村民 \n${wolf_number}狼人${wolf_roles.length > 0 ?'('+wolf_roles.join(',')+')':''} \n${mutant_roles.join(',')}`;
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
