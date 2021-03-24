const path = require('path');

module.exports = {
  entry: './src/app.tsx',
  devtool: 'inline-source-map',
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          'css-loader'
        ]
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          "style-loader",   // Creates `style` nodes from JS strings
          "css-loader",  // Translates CSS into CommonJS
          "sass-loader", // Compiles Sass to CSS
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, '..')
  },
  devServer: {
    contentBase: path.join(__dirname, '..'),
    compress: true,
    historyApiFallback: true,
    hot: true,
    port: 8081,
  }
};