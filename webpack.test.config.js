const path = require('path')
const webpack = require('webpack')
const CopyWebpackPlugin = require('copy-webpack-plugin')

const BUILD_DEV = !(process.env.NODE_ENV === "production")
const OUTPUTDIR = 'build'
const SRC_PATH = path.join(__dirname, './src')

console.log(`Running in BUILD_DEV=${BUILD_DEV} mode to OUTPUTDIR=${OUTPUTDIR}`)

// ///////////
// Plugins //
// ///////////

// main config
module.exports = {
    entry: {test:'./test/index.js'},
    output: {
        path: path.join(__dirname, OUTPUTDIR),
        filename: 'makehuman.test.js'
    },
    module: {
        loaders: [
            {
                test: /\.js$/i,
                // loaders: ['react-hot',{loader:'babel', query:{cacheDirectory: true}}],
                // Note: you need a the .babelrc file to solve http://stackoverflow.com/questions/32211649/debugging-with-webpack-es6-and-babel
                loader: 'babel',
                exclude: /(node_modules|bower_components)/,
                query: {
                    cacheDirectory: 'node_modules/.cache'
                }
            },
            // this loads it as javascript in one go
            {
                test: /\.json$/,
                loader: 'json-loader'
            },
        ]
    },
    resolve: {
        // modules: [
        //     SRC_PATH,
        //     './src/js',
        //     './test',
        //     './test/mocha',
        //     "node_modules",
        // ],
        // extentions to auto add if needed
        extensions: ["", ".js"]
    },
    devtool: 'inline-source-map',
    plugins: [new CopyWebpackPlugin([{ from: 'test/index.html', to:'.' }])],
    devServer: { port:'8081'}
}
