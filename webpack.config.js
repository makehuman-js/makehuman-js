

const path = require('path')
const webpack = require('webpack')

const BUILD_DEV = !(process.env.NODE_ENV === "production")
const OUTPUTDIR = 'dist'
const SRC_PATH = path.join(__dirname, './src')

console.log(`Running in BUILD_DEV=${BUILD_DEV} mode to OUTPUTDIR=${OUTPUTDIR}`)

// ///////////
// Plugins //
// ///////////

// uglify in production
const uglifyJsPlugin = new webpack.optimize.UglifyJsPlugin({
    minimize: !BUILD_DEV,
    sourceMap: BUILD_DEV,
    mangle: false,
    output: {
    },
    compress: {
        // drop_debugger: true,
        drop_console: !BUILD_DEV,
        // warnings: false,
        unused: true,
        dead_code: true
    }
})


const plugins = [
]
if (BUILD_DEV) {
    // DEVELOPMENT
    plugins.push(
    )
} else {
    console.warn('!!!!! RELEASE BUILD !!!!!\n')
    plugins.push(
        // Disable due to issue with this plugin
        // See https://github.com/webpack/webpack/issues/2644
        // new webpack.optimize.DedupePlugin(),
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.optimize.AggressiveMergingPlugin(),
        uglifyJsPlugin,
        new webpack.NoErrorsPlugin()
    )
}

// main config
module.exports = {
    entry: {makehuman:'./src/bundle.js'},
    output: {
        path: path.join(__dirname, OUTPUTDIR),
        filename: BUILD_DEV ? '[name].js' : '[name].min.js',
        libraryTarget: 'umd',
        library: '[name]'
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
        modules: [
            SRC_PATH,
            './src/js',
            './test',
            './test/mocha',
            "node_modules",
        ],
        // extentions to auto add if needed
        extensions: ["", ".js"]
    },
    devtool: BUILD_DEV ? 'source-map' : 'cheap-module-source-map', //  slower than 'cheap-module-eval-source-map'
    plugins
}
