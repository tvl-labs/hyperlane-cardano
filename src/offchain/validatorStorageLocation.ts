import { ethers } from "ethers";
import * as helios from "@hyperionbt/helios";
import { Address } from "./address";
import { keccak256Hasher } from "../merkle/hasher";
import { type H256 } from "./h256";

export interface ValidatorStorageLocation {
  validator: Address;
  mailboxDomain: number;
  mailboxAddress: Address;
  storageLocation: string;
  signature?: string; // 0x00..
}

export function hashValidatorStorageLocation(
  location: ValidatorStorageLocation
): H256 {
  const bufMailboxDomain = Buffer.alloc(4);
  bufMailboxDomain.writeUInt32BE(location.mailboxDomain);
  return keccak256Hasher(
    Buffer.concat([
      keccak256Hasher(
        Buffer.concat([
          bufMailboxDomain,
          location.mailboxAddress.toBuffer(),
          Buffer.from("HYPERLANE_ANNOUNCEMENT"),
        ])
      ).toBuffer(),
      Buffer.from(location.storageLocation),
    ])
  );
}

export function signValidatorStorageLocation(
  location: ValidatorStorageLocation,
  privateKey: string // Hex
): ValidatorStorageLocation {
  const signer = new ethers.Wallet(privateKey);
  location.signature = signer.signMessageSync(
    hashValidatorStorageLocation(location).toBuffer()
  );
  return location;
}

export function serializeValidatorStorageLocation(
  location: ValidatorStorageLocation
) {
  if (location.signature == null) {
    throw new Error("Unsigned validator storage location");
  }
  return new helios.ListData([
    new helios.ByteArray(location.validator.toHex().substring(2))._toUplcData(),
    new helios.IntData(BigInt(location.mailboxDomain)),
    new helios.ByteArray(
      location.mailboxAddress.toHex().substring(2)
    )._toUplcData(),
    new helios.ByteArray(
      helios.textToBytes(location.storageLocation)
    )._toUplcData(),
    new helios.ByteArray(location.signature.substring(2))._toUplcData(),
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
    signature: `0x${helios.bytesToHex(location.list[4].bytes)}`,
  };
}
