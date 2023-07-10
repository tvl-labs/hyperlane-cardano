import { waitForTxConfirmation } from '../offchain/waitForTxConfirmation';
import { getInboundMessages } from '../offchain/indexer/getInboundMessages';
import * as helios from '@hyperionbt/helios';
import { emulatedNetwork, wallet } from '../../index';
import secp256k1 from "secp256k1";
import ScriptLockForever from '../onchain/scriptLockForever.hl';
import createInboundMessage from '../offchain/tx/createInboundMessage';
import { blockfrost } from '../offchain/indexer/blockfrost';

// Mock inbound message
const origin = Array(32).fill(0);
const originMailbox = Array(32).fill(1);
const checkpointRoot = Array(32).fill(2);
const checkpointIndex = Array(32).fill(3);
const inboundMsg = `[${Date.now()}] Inbound Message!`;

// TODO: Build several edge cases.

const LABEL_HYPERLANE = helios.textToBytes("HYPERLANE");

// TODO: Stake on real networks
const addressMessage = helios.Address.fromValidatorHash(
  new ScriptLockForever().compile(true).validatorHash
);

const ownerPrivateKeys = [1, 2, 3].map((i) =>
  Uint8Array.from(
    Buffer.from(process.env[`PRIVATE_KEY_OWNER_${i}`] ?? "", "hex")
  )
);
const appParams = {
  VK_OWNERS: ownerPrivateKeys.map(
    (k) => new helios.ByteArray(Array.from(secp256k1.publicKeyCreate(k)))
  ),
  NUM_SIGNATURES_REQUIRED: 2n,
  ADDR_MESSAGE: addressMessage,
};

// TODO: Better interface & names here...
async function createInboundMsg(blockfrost?: helios.BlockfrostV0) {
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
  return await createInboundMessage(
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

export async function testInboxOnEmulatedNetwork() {
  emulatedNetwork.tick(1n);
  await createInboundMsg();
}

export async function testInboxOnPreprodNetwork() {
  const txIdInbound = await createInboundMsg(blockfrost);
  console.log(`Submitted inbound message at transaction ${txIdInbound.hex}!`);
  await waitForTxConfirmation(txIdInbound.hex);

  // Note: Not all messages are "text".
  const inboundMessages = (await getInboundMessages(appParams)).map((m) =>
    helios.bytesToText(m.bytes)
  );
  console.log("Inbound Messages:", inboundMessages);
  if (inboundMessages[inboundMessages.length - 1] !== inboundMsg) {
    throw new Error("Inbound message not found");
  }
}
