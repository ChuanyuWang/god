var request = require('request');
var express = require('express');
var router = express.Router();
//var util = require('../util');
var RateLimit = require('express-rate-limit');
var credentials = require('../credentials');
var connectionMgr = require('../util');
var assert = require('assert');

var wxConfig = {
    AppID: credentials.AppID,
    Secret: credentials.Secret
};

var loginLimiter = new RateLimit({
    windowMs: 1000*60, // 1 minutes
    max: 5, // limit each IP to 10 requests per windowMs
    delayMs: 0, // disable delaying - full speed until the max limit is reached
    // Error message returned when max is exceeded.
    message: "Too many login requests, please try again later."
  });

/* GET home page. */
router.get('/', loginLimiter, function (req, res) {
    res.render('index', {
        title : res.__('title'),
        navTitle : res.__('title')
    });
});

/*
 * 根据code获取微信用户的openid
 */
router.get('/wx/getCode', function(req, res, next) {
    var code = req.query.code || '';
    var urlStr = 'https://api.weixin.qq.com/sns/jscode2session?appid=' + wxConfig.AppID + '&secret=' + wxConfig.Secret + '&js_code=' + code + '&grant_type=authorization_code';
    request(urlStr, function (error, response, body) {
        if (!error) {
            res.end(body);
        } else {
            res.json(error);
        }
    })
});

/*
 * create game, return room number, e.g. 1999
 
 {
    "type": "lyingman",
    "player_number": 6,
    "wolf_number": 2,
    "villager_number": 2,
    "wolf_roles": [{
            "name": "白狼王",
            "value": "white",
            "checked": true
        }
    ],
    "roles": [{
            "name": "预言家",
            "value": "seer",
            "checked": "true"
        }, {
            "name": "女巫",
            "value": "witch",
            "checked": "true"
        }
    ],
    "options": {
        "witch_save_on_first_night": false
    },
    "judge": "<openid>"
}

 */
router.post('/wx/creategame', function(req, res, next) {
    var game_options = req.body || {};
    var newRoom = generateRoomID();

    var games = connectionMgr.connect('lyingman').get('games');
    games.findOne({
        status: 'started',
        room: newRoom
    }).then(function(doc) {
        if (doc) throw new Error('Bad luck, room is occupied. Try again later~');
        return createRoom(newRoom, game_options);
    }).then(function(room) {
        return games.insert(room);
    }).then(function(room) {
        res.json(room.room);
    }).catch(function(err) {
        var error = new Error('create game fails');
        error.innerError = err;
        next(error)
    });
});

/**
 * Create game object in games collection, e.g. 
 * {
    "_id": ObjectID("5af450d4e9966b48a044237b"),
    "room": 1883,
    "judge": "ocx7i5H6DoT9QS3UJGdv0jVp0dJ0",
    "status": "started",
    "next": "start",
    "players": [
        {
            "seat": 1,
            "role": null,
            "openid": "",
            "nickname": "",
            "avatar": ""
        },
        {
            "seat": 2,
            "role": null,
            "openid": "",
            "nickname": "",
            "avatar": ""
        },
        {
            "seat": 3,
            "role": null,
            "openid": "",
            "nickname": "",
            "avatar": ""
        }
    ],
    "roles": [{
            "role": "werewolf",
            "name": "狼人",
            "isMutant": false,
            "isGood": false
        },
        {
            "role": "villager",
            "name": "普通村民",
            "isMutant": false,
            "isGood": true
        },
        {
            "role": "seer",
            "name": "预言家",
            "isMutant": true,
            "isGood": true
    }],
    "options": {
        "witch_save_on_first_night": false
    }
}
 * @param {Integer} roomID room number from 0 - 9999
 * @param {Object} gameOptions game options object
 */
function createRoom(roomID, gameOptions) {
    assert(gameOptions.judge);
    var players = [];
    for (var i=1;i<=gameOptions.player_number;i++) {
        players.push({
            seat: i,
            role: null,
            openid: '',
            nickname: '',
            avatar: ''
        });
    }
    var roles = [];
    for (var i=0;i<gameOptions.wolf_number;i++) {
        if (gameOptions.wolf_roles[i]) {
            roles.push({
                role: gameOptions.wolf_roles[i].value,
                name: gameOptions.wolf_roles[i].name,
                isMutant: false,
                isGood: false
            })
        } else {
            roles.push({
                role: 'werewolf',
                name: '狼人',
                isMutant: false,
                isGood: false
            })
        }
    }

    for (var i=0;i<gameOptions.villager_number;i++) {
        roles.push({
            role: 'villager',
            name: '普通村民',
            isMutant: false,
            isGood: true
        })
    }

    for (var i=0;i<gameOptions.roles.length;i++) {
        roles.push({
            role: gameOptions.roles[i].value,
            name: gameOptions.roles[i].name,
            isMutant: true,
            isGood: true
        })
    }

    assert(roles.length === players.length);
    return {
        room: roomID,
        judge: gameOptions.judge,
        status: 'started',
        next: 'start',
        players: players,
        roles: roles,
        options: gameOptions.options
    }
}

function generateRoomID() {
    return parseInt(Math.random()*10000);
}

module.exports = router;
