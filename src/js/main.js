/**
 * --------------------------------------------------------------------------
 * main.js Home page main entry module
 * --------------------------------------------------------------------------
 */
var i18nextplugin = require('./locales/i18nextplugin');
var app = require('./components/test-console.vue').default;

// DOM Ready =============================================================
$(document).ready(function() {
    init();

    // bootstrap the test console panel
    new Vue({
        el: '#app', render: function(h) {
            return h(app);
        }
    });
});

// Functions =============================================================

function init() {
    console.log("welcome~~~");
    // load the i18next plugin to Vue
    Vue.use(i18nextplugin);

    moment.locale('zh-CN');
    //bootbox.setLocale('zh_CN');
}