import { ethers } from "ethers";
import {
  serializeValidatorStorageLocation,
  signValidatorStorageLocation,
  type ValidatorStorageLocation,
} from "../offchain/validatorStorageLocation";
import { DOMAIN_CARDANO } from "../rpc/mock/cardanoDomain";
import { Address } from "../offchain/address";
import { waitForTxConfirmation } from "../offchain/waitForTxConfirmation";
import { emulatedNetwork, emulatedWallet, preprodWallet } from "./index";
import announceValidatorStorageLocation from "../offchain/tx/announceValidatorStorageLocation";
import { getValidatorStorageLocation } from "../offchain/indexer/getValidatorStorageLocation";

const privateKey = `0x${process.env.PRIVATE_KEY_VALIDATOR_1 ?? ""}`;
const validator = Address.fromEvmAddress(ethers.computeAddress(privateKey));

const validatorStorageLocation: ValidatorStorageLocation =
  signValidatorStorageLocation(
    {
      validator,
      mailboxDomain: DOMAIN_CARDANO,
      mailboxAddress: Address.fromHex(
        "0x000000000000000000000000d8e78417e8c8d672258bbcb8ec078e15eb419730"
      ),
      storageLocation: `s3://khala-validator-signatures-${Date.now()}/us-east-1`,
    },
    privateKey
  );

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
  const preprodStorageLocation = await getValidatorStorageLocation(validator);
  if (
    serializeValidatorStorageLocation(validatorStorageLocation).toCborHex() !==
    serializeValidatorStorageLocation(preprodStorageLocation).toCborHex()
  ) {
    throw new Error("Invalid validator storage location");
  }
}