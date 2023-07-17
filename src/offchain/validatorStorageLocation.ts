import * as helios from "@hyperionbt/helios";
import type { Address } from "./address";

export interface ValidatorStorageLocation {
  validator: Address;
  mailboxDomain: number;
  mailboxAddress: Address;
  storageLocation: string;
}

export function serializeValidatorStorageLocation(
  location: ValidatorStorageLocation
) {
  return new helios.ListData([
    new helios.ByteArray(location.validator.toHex())._toUplcData(),
    new helios.IntData(BigInt(location.mailboxDomain)),
    new helios.ByteArray(location.mailboxAddress.toHex())._toUplcData(),
    new helios.ByteArray(
      helios.textToBytes(location.storageLocation)
    )._toUplcData(),
  ]);
}
