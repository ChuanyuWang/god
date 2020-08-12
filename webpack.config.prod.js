const path = require('path');
const webpack = require('webpack');
const VueLoaderPlugin = require('vue-loader/lib/plugin');

var hotMiddlewareScript = 'webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000&reload=true';


module.exports = {
    mode: process.env.NODE_ENV || 'production',
    target: "web",
    // Avoid inline-*** and eval-*** use in production as they can increase bundle size and reduce the overall performance.
    devtool: 'source-map',
    entry: [
        //'webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000',
        // And then the actual application
        './src/js/main.js'
        //main: ['./src/js/main.js', hotMiddlewareScript]
    ],

    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'public/js'),
        publicPath: '/js/'
    },
    resolve: {
        extensions: ['.js', '.vue', '.json'],
        alias: {
            //vue: 'vue/dist/vue.min.js'
        }
    },
    devServer: {
        hot: true,
        contentBase: './public/js',
    },
    externals: {
        jquery: '$',
        vue: 'Vue'
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    'vue-style-loader',
                    'css-loader'
                ],
            }, {
                test: /\.vue$/,
                loader: 'vue-loader',
                options: {
                    // disable the Hot Reload explicitly
                    hotReload: false
                    // other vue-loader options go here
                    // esModules: false // removed from v14.0.0, more information refer to https://github.com/vuejs/vue-loader/releases/tag/v14.0.0
                }
            },
            {
                enforce: 'pre',
                test: /\.(js|vue)$/,
                exclude: /node_modules/,
                loader: 'eslint-loader',
            },
            {
                test: /\.j1s$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            ['@babel/preset-env',
                                { "regenerator": true }
                            ]
                        ]
                    }
                }
            },
            // this will apple to template block `<template lang="pug">` in `.vue` files
            {
                test: /\.pug$/,
                loader: 'pug-plain-loader'
            },
            // this will apply to both plain `.less` files
            // AND `<style lang="less">` blocks in `.vue` files
            {
                test: /\.less$/,
                use: [
                    'vue-style-loader',
                    'css-loader',
                    'less-loader'
                ]
            }
        ]
    },
    plugins: [
        // make sure to include the plugin!
        new VueLoaderPlugin(),
        //new webpack.HotModuleReplacementPlugin(),
        // make jquery available for all modules
        new webpack.ProvidePlugin({
            $: 'jquery'
        })
    ],
    optimization: {
        minimize: true
    },
    performance: {
        hints: "warning"
    }
};
