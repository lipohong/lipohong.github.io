const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

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
      {
        test: /\.(png|svg|jpg|jpeg|gif|ico)$/i,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]',
          esModule: false
        },
      }
    ],
  },
  plugins: [
    new CopyWebpackPlugin({ patterns: [{ from: "src/index.html", to: "./" }, { from: "src/assets/file/.nojekyll", to: "./" }] })
  ],
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, './docs'),
    clean: true,
  },
  devServer: {
    contentBase: path.join(__dirname, './docs'),
    compress: true,
    historyApiFallback: true,
    hot: true,
    port: 8081,
  }
};