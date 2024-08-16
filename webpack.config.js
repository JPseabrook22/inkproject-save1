const path = require('path');

module.exports = {
    entry: './src/index.js', // Entry point for your application
    output: {
        path: path.resolve(__dirname, 'dist'), // This should match the output directory
        filename: 'bundle.js',
      },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ]
    },
    resolve: {
        extensions: ['.js'],
    },
    mode: 'development', // You can change this to 'production' for production builds
};
