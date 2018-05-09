module.exports = {
    options: {
        'watch': true,
        'banner': '/* Copyright 2016-2018 Chuanyu Wang */',
        'transform': [
            'vueify',
            'browserify-shim' // shim should be the last transformer
        ],
        plugin: [
            //['browserify-hmr',{ noServe : false }]
        ]
    },
    app2: {
        files: {
            'public/js/main.js': 'src/js/main.js'
        },
        options: {
            plugin: [
                ['browserify-hmr', { noServe : false }]
            ]
        }
    },
    app: {
        files: {
            
        }
    }
};