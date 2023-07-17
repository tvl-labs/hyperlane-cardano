import { type ValidatorStorageLocation } from "../offchain/validatorStorageLocation";
import { DOMAIN_CARDANO } from "../rpc/mock/cardanoDomain";
import { Address } from "../offchain/address";
import { waitForTxConfirmation } from "../offchain/waitForTxConfirmation";
import { emulatedNetwork, emulatedWallet, preprodWallet } from "./index";
import announceValidatorStorageLocation from "../offchain/tx/announceValidatorStorageLocation";

const validatorStorageLocation: ValidatorStorageLocation = {
  validator: Address.fromHex(
    "0x00000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c8"
  ),
  mailboxDomain: DOMAIN_CARDANO,
  mailboxAddress: Address.fromHex(
    "0x000000000000000000000000d8e78417e8c8d672258bbcb8ec078e15eb419730"
  ),
  storageLocation: "s3://khala-validator-signatures-1/us-east-1",
};

export async function testValidatorStorageLocationOnEmulatedNetwork() {
  emulatedNetwork.tick(1n);
  await announceValidatorStorageLocation(
    emulatedWallet,
    validatorStorageLocation
  );
}

export async function testValidatorStorageLocationOnPreprodNetwork() {
  const txId = await announceValidatorStorageLocation(
    preprodWallet,
    validatorStorageLocation
  );
  console.log(`Announce validator storage lcoation at tx ${txId.hex}!`);
  await waitForTxConfirmation(txId.hex);
}
