import type * as helios from "@hyperionbt/helios";

export interface AppParams {
  VALIDATOR_VKEYS: helios.ByteArray[];
  VALIDATOR_STORAGE_LOCATIONS: helios.ByteArray[];
  THRESHOLD: bigint;
  RECIPIENT_ADDRESS: helios.Address;
}
