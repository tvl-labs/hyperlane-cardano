import { waitForTxConfirmation } from "../offchain/waitForTxConfirmation";
import { getInboundMessages } from "../offchain/indexer/getInboundMessages";
import * as helios from "@hyperionbt/helios";
import { emulatedNetwork, emulatedWallet, preprodWallet } from "./index";
import secp256k1 from "secp256k1";
import { Address } from "../offchain/address";
import { type Message, calculateMessageId } from "../offchain/message";
import { MessagePayload } from "../offchain/messagePayload";
import { DOMAIN_CARDANO } from "../rpc/mock/cardanoDomain";
import { FUJI_DOMAIN } from "../rpc/mock/mockInitializer";
import {
  getIsmParams,
  getIsmParamsHelios,
  isInboundMessageDelivered,
  estimateInboundMessageFee,
  createInboundMessage,
} from "../offchain/inbox";

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

console.log(getIsmParams());
const ismParams = getIsmParamsHelios();

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
  const validatorPrivateKeys = [1, 2, 3].map((i) =>
    Uint8Array.from(
      Buffer.from(process.env[`PRIVATE_KEY_VALIDATOR_${i}`] ?? "", "hex")
    )
  );
  const signatures = validatorPrivateKeys.map(
    (k) =>
      new helios.ByteArray(
        Array.from(secp256k1.ecdsaSign(checkpointHash, k).signature)
      )
  );

  const isDelivered = await isInboundMessageDelivered(
    ismParams,
    inboundMessage
  );
  if (isDelivered) {
    throw new Error("Message must not be delivered already");
  }

  const fee = await estimateInboundMessageFee(
    ismParams,
    new helios.ByteArray(origin),
    new helios.ByteArray(originMailbox),
    new helios.ByteArray(checkpointRoot),
    new helios.ByteArray(checkpointIndex),
    inboundMessage,
    signatures,
    isEmulated ? emulatedWallet : preprodWallet
  );
  if (fee < 300_000n) {
    throw new Error("Invalid fee? Fee too low.");
  }

  return await createInboundMessage(
    ismParams,
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
  const txId = await createInboundMsg();
  console.log(`Submitted inbound message at tx ${txId.hex}!`);
  await waitForTxConfirmation(txId.hex);

  const isDelivered = await isInboundMessageDelivered(
    ismParams,
    inboundMessage
  );
  if (!isDelivered) {
    throw new Error("Message must have been delivered already");
  }

  // Note: Not all messages are "text".
  const inboundMessages = (await getInboundMessages(ismParams)).map((m) =>
    helios.bytesToText(m.bytes)
  );
  console.log("Inbound Messages:", inboundMessages);
  if (inboundMessages[inboundMessages.length - 1] !== inboundMsg) {
    throw new Error("Inbound message not found");
  }
}
