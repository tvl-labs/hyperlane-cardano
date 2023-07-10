import * as helios from '@hyperionbt/helios';

export const blockfrost = new helios.BlockfrostV0(
  "preprod",
  process.env.BLOCKFROST_PROJECT_ID ?? ""
);
