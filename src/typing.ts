import type * as helios from "@hyperionbt/helios";

export interface AppParams {
  VALIDATOR_VKEYS: helios.ByteArray[];
  THRESHOLD: bigint;
  RECIPIENT_ADDRESS: helios.Address;
}
