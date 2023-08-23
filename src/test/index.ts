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

export const emulatedNetwork = new helios.NetworkEmulator(644);
export const emulatedRelayerWallet = Wallet.fromEmulatedWallet(
  emulatedNetwork.createWallet(100_000_000n)
);
export const emulatedDappWallet = Wallet.fromEmulatedWallet(
  emulatedNetwork.createWallet(100_000_000n)
);
export const preprodRelayerWallet = new Wallet(
  new helios.Address(process.env.WALLET_ADDRESS ?? ""),
  new helios.PrivateKey(process.env.WALLET_PRIVATE_KEY ?? "")
);
export const preprodDappWallet = new Wallet(
  new helios.Address(process.env.DAPP_WALLET_ADDRESS ?? ""),
  new helios.PrivateKey(process.env.DAPP_WALLET_PRIVATE_KEY ?? "")
);

// NOTE: For some reasons, our webpack'ed test started to
// swallow errors and just exits gracefully on them..
// Hence the need of this `try/catch/process.exit(1)`.
try {
  const emulatedIsmParams = await testInboxOnEmulatedNetwork();
  const preprodIsmParams = await testInboxOnPreprodNetwork();

  // await testValidatorStorageLocationOnEmulatedNetwork();
  // await testValidatorStorageLocationOnPreprodNetwork();

  await testOutboxOnEmulatedNetwork(emulatedIsmParams);
  await testOutboxOnPreprodNetwork(preprodIsmParams);
} catch (e) {
  console.error(e);
  process.exit(1);
}
