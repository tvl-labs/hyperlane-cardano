import { ethers } from "ethers";
import * as helios from "@hyperionbt/helios";
import { Address } from "./address";
import { keccak256Hasher } from "./hasher";
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
    new helios.ByteArrayData(location.validator.toByteArray()),
    new helios.IntData(BigInt(location.mailboxDomain)),
    new helios.ByteArrayData(location.mailboxAddress.toByteArray()),
    new helios.ByteArrayData(helios.textToBytes(location.storageLocation)),
    new helios.ByteArrayData(
      helios.hexToBytes(location.signature.substring(2))
    ),
  ]);
}

export function deserializeValidatorStorageLocation(
  location: helios.ListData
): ValidatorStorageLocation {
  const locationDatum = JSON.parse(location.toSchemaJson()).list;
  return {
    validator: Address.fromHex(`0x${locationDatum[0].bytes as string}`),
    mailboxDomain: locationDatum[1].int,
    mailboxAddress: Address.fromHex(`0x${locationDatum[2].bytes as string}`),
    storageLocation: helios.bytesToText(
      helios.hexToBytes(locationDatum[3].bytes)
    ),
    signature: `0x${locationDatum[4].bytes as string}`,
  };
}
