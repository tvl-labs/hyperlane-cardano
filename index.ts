import * as helios from "@hyperionbt/helios";
import "dotenv/config";
import fetch from "node-fetch";
import secp256k1 from "secp256k1";

import { BLOCKFROST_PREFIX } from "./src/offchain/common";
import { getMessages } from "./src/offchain/indexer/getMessages";
import createMessage from "./src/offchain/tx/createMessage";
import createOutbox from "./src/offchain/tx/createOutbox";
import ScriptLockForever from "./src/onchain/scriptLockForever.hl";

// TODO: Build several edge cases.

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

const origin = Array(32).fill(0);
const originMailbox = Array(32).fill(1);
const checkpointRoot = Array(32).fill(2);
const checkpointIndex = Array(32).fill(3);

const emulatedNetwork = new helios.NetworkEmulator(644);
const wallet = emulatedNetwork.createWallet(10_000_000n);
await emulatedNetwork.tick(1n);

const blockfrost = new helios.BlockfrostV0(
  "preview",
  process.env.BLOCKFROST_PROJECT_ID
);

//
// Inbound
//

// TODO: Better interface & names here...
function createMsg(msg: string, blockfrost?: helios.BlockfrostV0) {
  const message = helios.textToBytes(msg);
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
  return createMessage(
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

// TODO: Give up after a certain number of tries
async function waitForConfirmation(txId) {
  console.log("Waiting for confirmation...");
  const r = await fetch(`${BLOCKFROST_PREFIX}/txs/${txId.hex}`, {
    headers: {
      project_id: process.env.BLOCKFROST_PROJECT_ID,
    },
  });
  if (r.status === 404) {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    return waitForConfirmation(txId);
  }
}

await createMsg("Hello world, Emulated Network!");

const txIdInbound = await createMsg(
  `[${Date.now()}] Hello world, Preview Network!`,
  blockfrost
);
console.log(`Submitted ${txIdInbound.hex}!`);
await waitForConfirmation(txIdInbound);

const messages = await getMessages(appParams);
console.log(
  "Onchain Authentic Messages:", // Note: Not all messages are "text".
  messages.map((m) => helios.bytesToText(m.bytes))
);

await emulatedNetwork.tick(1n);
// Blockfrost needs time to sync even after the previous confirmation...
await new Promise((resolve) => setTimeout(resolve, 3000));

//
// Outbound
//

await createOutbox(wallet);
const txIdOutbound = await createOutbox(wallet, blockfrost);
console.log(`Submitted ${txIdOutbound.hex}!`);
await waitForConfirmation(txIdOutbound);
