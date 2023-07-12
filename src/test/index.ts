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

export const emulatedNetwork = new helios.NetworkEmulator(644);
export const emulatedWallet = Wallet.fromEmulatedWallet(
  emulatedNetwork.createWallet(100_000_000n)
);
export const preprodWallet = new Wallet(
  new helios.Address(process.env.WALLET_ADDRESS ?? ""),
  new helios.PrivateKey(process.env.WALLET_PRIVATE_KEY ?? "")
);

await testInboxOnEmulatedNetwork();
await testInboxOnPreprodNetwork();

await testOutboxOnEmulatedNetwork();
await testOutboxOnPreprodNetwork();
