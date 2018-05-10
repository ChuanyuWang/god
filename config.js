module.exports = {
    port : 7004,
    log4js : {
        appenders : [{
                type : "console"
            }
        ],
        replaceConsole : true
    },
    cdnlibs : {
        vue     : '//cdn.bootcss.com/vue/2.5.16/vue.min.js',
        vue_dev : '//cdn.bootcss.com/vue/2.5.16/vue.js',
        i18next : '//cdn.bootcss.com/i18next/8.2.1/i18next.min.js',
        i18next_dev : '//cdn.bootcss.com/i18next/8.2.1/i18next.js',
        bootstrap_table_css : '//cdn.bootcss.com/bootstrap-table/1.12.1/bootstrap-table.min.css',
        bootstrap_table : '//cdn.bootcss.com/bootstrap-table/1.12.1/bootstrap-table.min.js',
        bootstrap_table_locale_zh_CN : '//cdn.bootcss.com/bootstrap-table/1.12.1/locale/bootstrap-table-zh-CN.min.js',
        bootbox : '//cdn.bootcss.com/bootbox.js/4.4.0/bootbox.min.js',
        moment: '//cdn.bootcss.com/moment.js/2.22.1/moment-with-locales.min.js',
        moment_dev: '//cdn.bootcss.com/moment.js/2.22.1/moment-with-locales.js'
    }
};
