module.exports = {
  mode: "development",
  entry: "./index.ts",
  output: {
    path: __dirname + "/dist/",
  },
  resolve: {
    extensions: [".ts"],
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
