module.exports = {
  mode: "development",
  entry: "./index.ts",
  output: {
    path: __dirname + "/dist/",
  },
  module: {
    rules: [
      {
        test: /\.hl/,
        exclude: /node_modules/,
        use: ["@hyperionbt/helios-loader"],
      },
    ],
  },
};
