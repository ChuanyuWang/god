module.exports = {
    port: 7004,
    log4js: {
        appenders: [{
            type: "console"
        }
        ],
        replaceConsole: true
    },
    cdnlibs: {
        vue: 'https://cdn.bootcss.com/vue/2.5.16/vue.min.js',
        vue_dev: 'https://cdn.bootcss.com/vue/2.5.16/vue.js',
        i18next: 'https://cdn.bootcdn.net/ajax/libs/i18next/11.3.2/i18next.min.js',
        i18next_dev: 'https://cdn.bootcdn.net/ajax/libs/i18next/11.3.2/i18next.js',
        bootstrap_table_css: 'https://cdnjs.cloudflare.com/ajax/libs/bootstrap-table/1.12.1/bootstrap-table.min.css',
        bootstrap_table: 'https://cdnjs.cloudflare.com/ajax/libs/bootstrap-table/1.12.1/bootstrap-table.min.js',
        bootstrap_table_locale_zh_CN: 'https://cdnjs.cloudflare.com/ajax/libs/bootstrap-table/1.12.1/locale/bootstrap-table-zh-CN.min.js',
        bootbox: 'https://cdnjs.cloudflare.com/ajax/libs/bootbox.js/4.4.0/bootbox.min.js',
        momentjs: 'https://cdn.bootcdn.net/ajax/libs/moment.js/2.22.1/moment-with-locales.min.js',
        momentjs_dev: 'https://cdn.bootcdn.net/ajax/libs/moment.js/2.22.1/moment-with-locales.js'
    }
};
