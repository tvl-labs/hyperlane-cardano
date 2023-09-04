import * as helios from "@hyperionbt/helios";

export const blockfrostProjectId = (() => {
  if (process.env.BLOCKFROST_PROJECT_ID === undefined) {
    throw new Error("BLOCKFROST_PROJECT_ID is not set");
  }
  return process.env.BLOCKFROST_PROJECT_ID ?? "";
})();

export const blockfrostPrefix = (() => {
  if (process.env.BLOCKFROST_PREFIX === undefined) {
    throw new Error("BLOCKFROST_PREFIX is not set");
  }
  return process.env.BLOCKFROST_PREFIX ?? "";
})();

export const blockfrost = new helios.BlockfrostV0(
  "preprod",
  blockfrostProjectId
);
