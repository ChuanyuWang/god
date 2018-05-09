module.exports = function (grunt, options) {
    return {
        options: {
            //Shared Options Hash
        },
        dev: {
            // set the environment 'NODE_ENV' for browserify transform 'vueify'
            NODE_ENV: grunt.option('environment') || 'development'
        },
        dist: {
            // set the environment 'NODE_ENV' for browserify transform 'vueify'
            NODE_ENV: 'production'
        }
    };
};
