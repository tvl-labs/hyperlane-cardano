const {resolve} = require('path');

module.exports = {
  target: 'node',
  mode: "development",
  entry: {
    test: "./index.ts",
    rpc: './src/rpc/index.ts'
  },
  output: {
    filename: "[name].js",
    path: resolve(__dirname, "dist")
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts/,
        exclude: /node_modules/,
        loader: "ts-loader",
      },
      {
        test: /\.hl/,
        exclude: /node_modules/,
        loader: "@hyperionbt/helios-loader",
      },
    ],
  },
};
