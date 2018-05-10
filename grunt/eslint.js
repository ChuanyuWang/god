module.exports = {
    options: {
        configFile: 'conf/eslint.json',
        //rulePaths: ['conf/rules'],
        //quiet: true
        fix: true,
        color: true,
        cache: true
    },
    nodeFiles: {
        files: {
            src: ['routes/**/*.js','*.js']
        },
        options: {
            configFile: 'conf/node.json',
        }
    },
    browserFiles: {
        files: {
            src: ['src/**/*.js']
        },
        options: {
            configFile: 'conf/browser.json',
        }
    }
};
