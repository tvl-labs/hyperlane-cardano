import * as helios from "@hyperionbt/helios";
import "dotenv/config";
import fetch from "node-fetch";
import secp256k1 from "secp256k1";

import { BLOCKFROST_PREFIX } from "./src/offchain/common";
import { getInboundMessages } from "./src/offchain/indexer/getInboundMessages";
import { getOutboundMessages } from "./src/offchain/indexer/getOutboundMessages";
import createInboundMessage from "./src/offchain/tx/createInboundMessage";
import createOutboundMessage from "./src/offchain/tx/createOutboundMessage";
import createOutbox from "./src/offchain/tx/createOutbox";
import ScriptLockForever from "./src/onchain/scriptLockForever.hl";

// TODO: Build several edge cases.

// This is close to random, depending on how stable the Preview network is.
const BLOCKFROST_WAIT_TIME = 25000;

const LABEL_HYPERLANE = helios.textToBytes("HYPERLANE");

// TODO: Stake on real networks
const addressMessage = helios.Address.fromValidatorHash(
  new ScriptLockForever().compile(true).validatorHash
);

const ownerPrivateKeys = [1, 2, 3].map((i) =>
  Uint8Array.from(Buffer.from(process.env[`PRIVATE_KEY_OWNER_${i}`], "hex"))
);
const appParams = {
  VK_OWNERS: ownerPrivateKeys.map(
    (k) => new helios.ByteArray(Array.from(secp256k1.publicKeyCreate(k)))
  ),
  NUM_SIGNATURES_REQUIRED: 2n,
  ADDR_MESSAGE: addressMessage,
};

// Mock inbound message
const origin = Array(32).fill(0);
const originMailbox = Array(32).fill(1);
const checkpointRoot = Array(32).fill(2);
const checkpointIndex = Array(32).fill(3);
const inboundMsg = `[${Date.now()}] Inbound Message!`;

// Mock outbound message
const version = Array(1).fill(4);
const nonce = Array(4).fill(5);
const originDomain = Array(4).fill(6);
const sender = Array(32).fill(7);
const destinationDomain = Array(4).fill(8);
const recipient = Array(32).fill(9);
const outboundMsg = `[${Date.now()}] Outbound message!`;

const emulatedNetwork = new helios.NetworkEmulator(644);
const wallet = emulatedNetwork.createWallet(10_000_000n);

const blockfrost = new helios.BlockfrostV0(
  "preview",
  process.env.BLOCKFROST_PROJECT_ID
);

// TODO: Give up after a certain number of tries
async function waitForConfirmation(txIdHex: string) {
  console.log("Waiting for confirmation...");
  const r = await fetch(`${BLOCKFROST_PREFIX}/txs/${txIdHex}`, {
    headers: {
      project_id: process.env.BLOCKFROST_PROJECT_ID,
    },
  });
  if (r.status === 404) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    return waitForConfirmation(txIdHex);
  }
}

//
// Inbound
//

await emulatedNetwork.tick(1n);
// TODO: Better interface & names here...
function createInboundMsg(blockfrost?: helios.BlockfrostV0) {
  const message = helios.textToBytes(inboundMsg);
  const messageHash = new Uint8Array(
    helios.Crypto.blake2b(
      helios.Crypto.blake2b(
        origin.concat(originMailbox).concat(LABEL_HYPERLANE)
      )
        .concat(checkpointRoot)
        .concat(checkpointIndex)
        .concat(helios.Crypto.blake2b(message))
    )
  );
  const signatures = ownerPrivateKeys.map(
    (k) =>
      new helios.ByteArray(
        Array.from(secp256k1.ecdsaSign(messageHash, k).signature)
      )
  );
  return createInboundMessage(
    appParams,
    new helios.ByteArray(origin),
    new helios.ByteArray(originMailbox),
    new helios.ByteArray(checkpointRoot),
    new helios.ByteArray(checkpointIndex),
    new helios.ByteArray(message),
    signatures,
    wallet,
    blockfrost
  );
}
await createInboundMsg();

const txIdInbound = await createInboundMsg(blockfrost);
console.log(`Submitted inbound message ${txIdInbound.hex}!`);
await waitForConfirmation(txIdInbound.hex);

// Note: Not all messages are "text".
const inboundMessages = (await getInboundMessages(appParams)).map((m) =>
  helios.bytesToText(m.bytes)
);
console.log("Inbound Messages:", inboundMessages);
if (inboundMessages[inboundMessages.length - 1] !== inboundMsg) {
  throw new Error("Inbound message not found");
}

// Blockfrost needs time to sync even after the previous confirmation...
await new Promise((resolve) => setTimeout(resolve, BLOCKFROST_WAIT_TIME));

//
// Outbound
//

await emulatedNetwork.tick(1n);
const emulatedUtxoOutbox = await createOutbox(wallet);
await emulatedNetwork.tick(1n);

async function createOutboundMsg(
  utxo: helios.UTxO,
  blockfrost?: helios.BlockfrostV0
) {
  return createOutboundMessage(
    utxo,
    new helios.ByteArray(version),
    new helios.ByteArray(nonce),
    new helios.ByteArray(originDomain),
    new helios.ByteArray(sender),
    new helios.ByteArray(destinationDomain),
    new helios.ByteArray(recipient),
    new helios.ByteArray(helios.textToBytes(outboundMsg)),
    wallet,
    blockfrost
  );
}
await createOutboundMsg(emulatedUtxoOutbox);

const previewUtxoOutbox = await createOutbox(wallet, blockfrost);
console.log(`Submitted outbox ${previewUtxoOutbox.txId.hex}!`);
await waitForConfirmation(previewUtxoOutbox.txId.hex);

// Blockfrost needs time to sync even after the previous confirmation...
await new Promise((resolve) => setTimeout(resolve, BLOCKFROST_WAIT_TIME));

const txId = await createOutboundMsg(previewUtxoOutbox, blockfrost);
console.log(`Submitted outbound message ${txId.hex}!`);
await waitForConfirmation(txId.hex);

// Blockfrost needs time to sync even after the previous confirmation...
await new Promise((resolve) => setTimeout(resolve, BLOCKFROST_WAIT_TIME));

// Note: Not all messages are "text".
const outboundMessages = (await getOutboundMessages()).map((m) =>
  helios.bytesToText(m.bytes)
);
console.log("(Latest) Outbound Messages:", outboundMessages);
if (outboundMessages[outboundMessages.length - 1] !== outboundMsg) {
  throw new Error("Outbound message not found");
}
