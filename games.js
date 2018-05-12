/**
 * Module exports.
 */

module.exports = GameServer;

function GameServer(httpServer) {
    const io = require('socket.io')(httpServer);

    io.on('connection', function(socket) {
        if (!hasRoom(socket.handshake.query)) return socket.disconnect();

        console.log(`user ${socket.id} joins room ${socket.handshake.query.room}`);

        socket.emit('which room', (roomID) => {
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
