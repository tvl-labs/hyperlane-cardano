import { ethers } from "ethers";
import {
  serializeValidatorStorageLocation,
  signValidatorStorageLocation,
  type ValidatorStorageLocation,
} from "../offchain/validatorStorageLocation";
import { DOMAIN_CARDANO } from "./testDomains";
import { Address } from "../offchain/address";
import { waitForTxConfirmation } from "../offchain/blockfrost/waitForTxConfirmation";
import {
  emulatedNetwork,
  emulatedRelayerWallet,
  preprodRelayerWallet,
} from "./index";
import announceValidatorStorageLocation from "../offchain/tx/announceValidatorStorageLocation";
import { getValidatorStorageLocation } from "../offchain/indexer/getValidatorStorageLocation";
import { requireEnv } from "../offchain/env.utils";

const privateKey = `0x${requireEnv(process.env.PRIVATE_KEY_VALIDATOR_1)}`;
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
    emulatedRelayerWallet,
    validatorStorageLocation
  );
}

export async function testValidatorStorageLocationOnPreprodNetwork() {
  const txId = await announceValidatorStorageLocation(
    preprodRelayerWallet,
    validatorStorageLocation
  );
  console.log(`Announce validator storage location at tx ${txId.hex}!`);
  await waitForTxConfirmation(txId);
  const preprodStorageLocation = await getValidatorStorageLocation(validator);
  if (
    preprodStorageLocation === undefined ||
    serializeValidatorStorageLocation(validatorStorageLocation).toCborHex() !==
      serializeValidatorStorageLocation(preprodStorageLocation).toCborHex()
  ) {
    throw new Error("Invalid validator storage location");
  }
}
