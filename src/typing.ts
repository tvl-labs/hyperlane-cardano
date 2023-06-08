import * as helios from "@hyperionbt/helios";

export type AppParams = {
  VK_OWNERS: helios.ByteArray[];
  NUM_SIGNATURES_REQUIRED: bigint;
  ADDR_MESSAGE: helios.Address;
};
