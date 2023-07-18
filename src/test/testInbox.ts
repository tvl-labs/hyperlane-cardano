import { waitForTxConfirmation } from "../offchain/waitForTxConfirmation";
import { getInboundMessages } from "../offchain/indexer/getInboundMessages";
import * as helios from "@hyperionbt/helios";
import { emulatedNetwork, emulatedWallet, preprodWallet } from "./index";
import secp256k1 from "secp256k1";
import ScriptLockForever from "../onchain/scriptLockForever.hl";
import createInboundMessage from "../offchain/tx/createInboundMessage";
import { Address } from "../offchain/address";
import { type Message, calculateMessageId } from "../offchain/message";
import { MessagePayload } from "../offchain/messagePayload";
import { DOMAIN_CARDANO } from "../rpc/mock/cardanoDomain";
import { FUJI_DOMAIN } from "../rpc/mock/mockInitializer";

// Mock inbound message
const origin = Array(32).fill(0);
const originMailbox = Array(32).fill(1);
const checkpointRoot = Array(32).fill(2);
const checkpointIndex = Array(32).fill(3);
const inboundMsg = `[${Date.now()}] Inbound Message!`;
const inboundMessage: Message = {
  version: 0,
  nonce: 0,
  originDomain: FUJI_DOMAIN,
  sender: Address.fromHex(
    "0x0000000000000000000000000000000000000000000000000000000000000EF1"
  ),
  destinationDomain: DOMAIN_CARDANO,
  recipient: Address.fromHex(
    "0x0000000000000000000000000000000000000000000000000000000000000CA1"
  ),
  message: MessagePayload.fromString(inboundMsg),
};

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
  VALIDATOR_VKEYS: ownerPrivateKeys.map(
    (k) => new helios.ByteArray(Array.from(secp256k1.publicKeyCreate(k)))
  ),
  THRESHOLD: 2n,
  RECIPIENT_ADDRESS: addressMessage,
};

// TODO: Better interface & names here...
async function createInboundMsg(isEmulated: boolean = false) {
  const checkpointHash = new Uint8Array(
    helios.Crypto.blake2b(
      helios.Crypto.blake2b(
        origin.concat(originMailbox).concat(LABEL_HYPERLANE)
      )
        .concat(checkpointRoot)
        .concat(checkpointIndex)
        .concat(calculateMessageId(inboundMessage).toByteArray())
    )
  );
  const signatures = ownerPrivateKeys.map(
    (k) =>
      new helios.ByteArray(
        Array.from(secp256k1.ecdsaSign(checkpointHash, k).signature)
      )
  );
  return await createInboundMessage(
    appParams,
    new helios.ByteArray(origin),
    new helios.ByteArray(originMailbox),
    new helios.ByteArray(checkpointRoot),
    new helios.ByteArray(checkpointIndex),
    inboundMessage,
    signatures,
    isEmulated ? emulatedWallet : preprodWallet
  );
}

export async function testInboxOnEmulatedNetwork() {
  emulatedNetwork.tick(1n);
  await createInboundMsg(true);
}

export async function testInboxOnPreprodNetwork() {
  const txIdInbound = await createInboundMsg();
  console.log(`Submitted inbound message at tx ${txIdInbound.hex}!`);
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
