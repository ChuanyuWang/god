/**
 * --------------------------------------------------------------------------
 * main.js Home page main entry module
 * --------------------------------------------------------------------------
 */
var i18nextplugin = require('./locales/i18nextplugin');
// Must use .default when require vue component, refer to https://github.com/vuejs/vue-loader/issues/1172
var app = require('./components/test-console.vue').default;
var jq = require('jquery');

// DOM Ready =============================================================
jq(document).ready(function() {
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