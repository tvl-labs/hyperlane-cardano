import "dotenv/config";
import * as helios from "@hyperionbt/helios";
import {
  testInboxOnEmulatedNetwork,
  testInboxOnPreprodNetwork,
} from "./testInbox";
import {
  testOutboxOnEmulatedNetwork,
  testOutboxOnPreprodNetwork,
} from "./testOutbox";

export const emulatedNetwork = new helios.NetworkEmulator(644);
export const wallet = emulatedNetwork.createWallet(100_000_000n);

await testInboxOnEmulatedNetwork();
await testInboxOnPreprodNetwork();

await testOutboxOnEmulatedNetwork();
await testOutboxOnPreprodNetwork();
