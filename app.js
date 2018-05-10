var express = require('express');
//var compression = require('compression')
var path = require('path');
var util = require('./util');
//var favicon = require('serve-favicon');
var logger = require('morgan');
//var cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
//var flash = require('connect-flash');
var config = require('./config');
var i18n = require('i18n');

// main application
var app = express();
app.locals.CDN_FILES = config.cdnlibs;

var env = process.env.NODE_ENV || 'development';
app.locals.ENV = env;
app.locals.ENV_DEVELOPMENT = env == 'development';

// set the logging
//var log4js = require('log4js');
//log4js.configure(config.log4js);
//log4js.getLogger().setLevel("TRACE");

//setting various HTTP headers.
app.use(require('helmet')());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.locals.pretty = true; // output the pretty html for consistency 

// app.use(favicon(__dirname + '/public/img/favicon.ico'));
if (app.locals.ENV_DEVELOPMENT) {
    app.use(logger('dev'));
} else {
    app.use(logger('common'));
}

// Use gzip compression
//app.use(compression())

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

//app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'keyboard god',
    resave: false, //don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored
    store: new MongoStore({
        url: util.connectionURI('config') + '?authSource=admin&w=1',
        touchAfter: 24 * 3600 // time period in seconds
    }),
    cookie: { 
        //this attribute tells the browser to only send the cookie 
        // if the request is being sent over HTTPS.
        secure: !app.locals.ENV_DEVELOPMENT,
        //this attribute is used to help prevent attacks such as cross-site scripting, 
        // since it does not allow the cookie to be accessed via JavaScript.
        httpOnly: true 
    }
}));

//i18n configuration
i18n.configure({
    locales: ['zh'],
    // where to store json files
    directory: __dirname + '/locales',
    defaultLocale: 'zh',
    // query parameter to switch locale (ie. /home?lang=ch)
    queryParameter: 'lang',
    // watch for changes in json files to reload locale on updates
    autoReload: false // set as false, otherwise may fail git checkout
});
app.use(i18n.init);


// add router
var routes = require('./routes/index');
app.use('/', routes);

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// log error to std or err or file for persistent
app.use(function(err, req, res, next) {
    console.error(err.stack);
    if (err.innerError) {
        console.error(" is caused by ");
        console.error(err.innerError);
    }
    next(err);
});

// handle client error and return an error object
app.use(function(err, req, res, next) {
    if (req.xhr) {
        res.status(err.status || 500);
        res.send({
            message: err.message,
            code: err.code
        });
    } else {
        next(err);
    }
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err,
            title: 'error'
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {},
        title: 'error'
    });
});

module.exports = app;
