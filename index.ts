import * as helios from "@hyperionbt/helios";
import "dotenv/config";
import {
  testOutboxOnEmulatedNetwork,
  testOutboxOnPreprodNetwork,
} from "./src/test/testOutbox";
import {
  testInboxOnEmulatedNetwork,
  testInboxOnPreprodNetwork,
} from "./src/test/testInbox";

export const emulatedNetwork = new helios.NetworkEmulator(644);
export const wallet = emulatedNetwork.createWallet(10_000_000n);

await testInboxOnEmulatedNetwork();
await testInboxOnPreprodNetwork();

await testOutboxOnEmulatedNetwork();
await testOutboxOnPreprodNetwork();
