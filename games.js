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
        status: 'started',
        room: roomID
    }).then(function(doc) {
        if (!doc) throw new Error(`Can't find room ${roomID}`);
        return doc;
    }).then(function(doc) {
        user.emit('update', {
            phase: 'sit down',
            players: doc.players
        });
    }).catch(function(err) {
        user.emit('update', {
            error: err.toString()
        });
    });
    // Add the user as one of the players if it's not full
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
 * @param {*} query 
 */
function hasRoom(query) {
    let room = parseInt(query.room || -1);
    if (isNaN(room) || room < 0 || room > 9999) {
        return false;
    }
    return true;
}
