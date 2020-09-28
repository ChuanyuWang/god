/**
 * --------------------------------------------------------------------------
 * main.js Home page main entry module
 * --------------------------------------------------------------------------
 */
var i18nextplugin = require('./locales/i18nextplugin');
// Must use .default when require vue component, refer to https://github.com/vuejs/vue-loader/issues/1172
var App = require('./components/test-console.vue').default;
//import App from './components/test-console.vue';

// DOM Ready =============================================================
$(function() {
    // Handler for .ready() called.
    init();

    /* bootstrap the test console panel
    new Vue({
        el: '#app', render: function(h) {
            return h(app);
        }
    });
    */
    new Vue({ el: '#app', components: { App }, template: "<app/>" });
});

// Functions =============================================================

function init() {
    console.log("welcome~~~");
    // load the i18next plugin to Vue
    Vue.use(i18nextplugin);

    moment.locale('zh-CN');
    //bootbox.setLocale('zh_CN');
}
