var request = require('request');
var express = require('express');
var router = express.Router();
//var util = require('../util');
var RateLimit = require('express-rate-limit');
var credentials = require('../credentials');

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
    }
}

 */
router.post('/wx/creategame', function(req, res, next) {
    var game_options = req.body || {};
    res.json(game_options);
});

module.exports = router;
