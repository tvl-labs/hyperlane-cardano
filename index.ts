import * as helios from "@hyperionbt/helios";
import "dotenv/config";
import fetch from "node-fetch";
const { randomBytes } = require("crypto");
import secp256k1 from "secp256k1";

import { BLOCKFROST_PREFIX } from "./src/offchain/common";
import { getMessages } from "./src/offchain/indexer/getMessages";
import createMessage from "./src/offchain/tx/createMessage";
import ScriptLockForever from "./src/onchain/scriptLockForever.hl";

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

await createMsg("Hello world, Emulated Network!");

const txId = await createMsg(
  "Hello world, Preview Network!",
  new helios.BlockfrostV0("preview", process.env.BLOCKFROST_PROJECT_ID)
);
console.log(`Submitted ${txId.hex}!`);

// TODO: Give up after a certain number of tries
await (async function waitForConfirmation() {
  console.log("Waiting for confirmation...");
  const r = await fetch(`${BLOCKFROST_PREFIX}/txs/${txId.hex}`, {
    headers: {
      project_id: process.env.BLOCKFROST_PROJECT_ID,
    },
  });
  if (r.status === 404) {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    return waitForConfirmation();
  }
})();

const messages = await getMessages(appParams);
console.log(
  "Onchain Authentic Messages:", // Note: Not all messages are "text".
  messages.map((m) => helios.bytesToText(m.bytes))
);

// TODO: Build several edge cases.
