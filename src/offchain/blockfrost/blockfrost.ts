import * as helios from "@hyperionbt/helios";
import { requireEnv } from "../env.utils";

export const blockfrostProjectId = requireEnv(
  process.env.BLOCKFROST_PROJECT_ID
);

export const blockfrostPrefix = requireEnv(process.env.BLOCKFROST_PREFIX);

export const blockfrost = new helios.BlockfrostV0(
  "preprod",
  blockfrostProjectId
);
