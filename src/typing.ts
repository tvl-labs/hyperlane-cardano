import type * as helios from "@hyperionbt/helios";

export interface AppParams {
  VK_OWNERS: helios.ByteArray[];
  NUM_SIGNATURES_REQUIRED: bigint;
  ADDR_MESSAGE: helios.Address;
}
