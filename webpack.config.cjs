const { resolve } = require("path");

module.exports = {
  target: "node",
  mode: "development",
  entry: {
    testIntegration: "./src/test/index.ts",
    rpc: "./src/rpc/index.ts",
    announceValidatorStorage: "./src/cli/announceValidatorStorage.ts",
    createValidatorKey: "./src/cli/createValidatorKey.ts",
    sendKhalaniToCardanoUsdcMintMessage: "./src/cli/sendKhalaniToCardanoUsdcMintMessage.ts",
    sendCardanoToKhalaniUsdcMessage: "./src/cli/sendCardanoToKhalaniUsdcMessage.ts",
    processPendingUsdcMintRequests: "./src/cli/processPendingUsdcMintRequests.ts",
    deployNewInbox: "./src/cli/deployNewInbox.ts",
    deployNewOutbox: "./src/cli/deployNewOutbox.ts",
  },
  output: {
    filename: "[name].js",
    path: resolve(__dirname, "dist"),
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
