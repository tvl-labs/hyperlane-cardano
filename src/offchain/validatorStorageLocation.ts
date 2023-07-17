import * as helios from "@hyperionbt/helios";
import { Address } from "./address";

export interface ValidatorStorageLocation {
  validator: Address;
  mailboxDomain: number;
  mailboxAddress: Address;
  storageLocation: string;
  signature: string; // hex
}

export function serializeValidatorStorageLocation(
  location: ValidatorStorageLocation
) {
  return new helios.ListData([
    new helios.ByteArray(location.validator.toHex().substring(2))._toUplcData(),
    new helios.IntData(BigInt(location.mailboxDomain)),
    new helios.ByteArray(
      location.mailboxAddress.toHex().substring(2)
    )._toUplcData(),
    new helios.ByteArray(
      helios.textToBytes(location.storageLocation)
    )._toUplcData(),
    new helios.ByteArray(helios.hexToBytes(location.signature))._toUplcData(),
  ]);
}

export function deserializeValidatorStorageLocation(
  location: helios.ListData
): ValidatorStorageLocation {
  return {
    validator: Address.fromHex(
      `0x${helios.bytesToHex(location.list[0].bytes)}`
    ),
    mailboxDomain: Number(location.list[1].int),
    mailboxAddress: Address.fromHex(
      `0x${helios.bytesToHex(location.list[2].bytes)}`
    ),
    storageLocation: helios.bytesToText(location.list[3].bytes),
    signature: helios.bytesToHex(location.list[4].bytes),
  };
}
