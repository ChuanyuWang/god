//var mongojs = require('mongojs');
var util = require('util');
var config = require('./credentials');
var monk = require('monk');

// Store all connected connections.
var monkConnections = {};

// export helper functions
var helpers = {};

helpers.connectionURI = function(database) {
    //https://mongodb.github.io/node-mongodb-native/driver-articles/mongoclient.html
    return util.format("mongodb://%s:%s@%s/%s", config.user, config.pass, config.host, database);
};

/**
 * 
 * @param {String} database name of database to be connected
 * @returns connection created by `monk(uri, options)`
 */
helpers.connect = function(database) {
    if (typeof database != "string" || database.length == 0) {
        throw new Error("parameter database is not string or empty");
    }
    //  If a connection was found, return with it.
    if (monkConnections[database]) {
        return monkConnections[database];
    }
    var options = {
        //keepAlive: 120,
        reconnectTries: Number.MAX_VALUE, // Never stop trying to reconnect
        reconnectInterval: 500, // Reconnect every 500ms
        poolSize: 3, // Maintain up to 3 socket connections for each database
        // If not connected, return errors immediately rather than waiting for reconnect
        bufferMaxEntries: 0,
        authSource: 'admin'
    };

    //https://mongodb.github.io/node-mongodb-native/driver-articles/mongoclient.html
    var uriString = util.format("mongodb://%s:%s@%s/%s", config.user, config.pass, config.host, database);
    var conn = monk(uriString, options);
    conn.then(function(params) {
        console.log('[monk] database "%s" is connected', database);
    }, function(err) {
        console.error('[monk] connect database "%s" with error', database, err);
        delete monkConnections[database];
    });

    // Store the connection in the connections pool.
    monkConnections[database] = conn;
    return conn;
};

module.exports = helpers;