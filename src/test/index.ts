import "dotenv/config";
import * as helios from "@hyperionbt/helios";
import { Wallet } from "../offchain/wallet";
import {
  testInboxOnEmulatedNetwork,
  testInboxOnPreprodNetwork,
} from "./testInbox";
import {
  testOutboxOnEmulatedNetwork,
  testOutboxOnPreprodNetwork,
} from "./testOutbox";
import {
  testValidatorStorageLocationOnEmulatedNetwork,
  testValidatorStorageLocationOnPreprodNetwork,
} from "./testValidatorStorageLocation";
import { createWallet } from "../cli/wallet";
import { requireEnv } from "../offchain/env.utils";

export const emulatedNetwork = new helios.NetworkEmulator(644);
export const emulatedRelayerWallet = Wallet.fromEmulatedWallet(
  emulatedNetwork.createWallet(100_000_000n)
);
export const emulatedDappWallet = Wallet.fromEmulatedWallet(
  emulatedNetwork.createWallet(100_000_000n)
);

export const preprodRelayerWallet = createWallet(
  requireEnv(process.env.WALLET_ADDRESS),
  requireEnv(process.env.WALLET_PRIVATE_KEY)
);

/**
 * Wallet used as the recipient of test USDC tokens.
 */
export const preprodDappWallet = createWallet(
  requireEnv(process.env.DAPP_WALLET_ADDRESS),
  requireEnv(process.env.DAPP_WALLET_PRIVATE_KEY)
);

// NOTE: For some reasons, our webpack test started to
// swallow errors and just exits gracefully on them.
// Hence, the need of this `try/catch/process.exit(1)`.
try {
  const emulatedIsmParams = await testInboxOnEmulatedNetwork();
  const preprodIsmParams = await testInboxOnPreprodNetwork();

  await testValidatorStorageLocationOnEmulatedNetwork();
  await testValidatorStorageLocationOnPreprodNetwork();

  await testOutboxOnEmulatedNetwork(emulatedIsmParams);
  await testOutboxOnPreprodNetwork(preprodIsmParams);
} catch (e) {
  console.error(e);
  process.exit(1);
}
