import { waitForTxConfirmation } from "../offchain/waitForTxConfirmation";
import { getInboundMessages } from "../offchain/indexer/getInboundMessages";
import * as helios from "@hyperionbt/helios";
import { emulatedNetwork, emulatedWallet, preprodWallet } from "./index";
import secp256k1 from "secp256k1";
import { Address } from "../offchain/address";
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
import { type Checkpoint, hashCheckpoint } from "../offchain/checkpoint";
import { calculateMessageId, type Message } from "../offchain/message";

// TODO: Build several edge cases.

// Mock inbound message
const inboundMsg = `[${Date.now()}] Inbound Message!`;
const message: Message = {
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
  body: MessagePayload.fromString(inboundMsg),
};
const checkpoint: Checkpoint = {
  origin: FUJI_DOMAIN,
  originMailbox: Address.fromHex(
    "0x000000000000000000000000d8e78417e8c8d672258bbcb8ec078e15eb419730"
  ),
  checkpointRoot: Buffer.alloc(32).fill(0),
  checkpointIndex: 0,
  message,
};

console.log(getIsmParams());
const ismParams = getIsmParamsHelios();

// TODO: Better interface & names here...
async function createInboundMsg(isEmulated: boolean = false) {
  const checkpointHash = hashCheckpoint(checkpoint);
  const validatorPrivateKeys = [1, 2, 3].map((i) =>
    Buffer.from(process.env[`PRIVATE_KEY_VALIDATOR_${i}`] ?? "", "hex")
  );
  const signatures = validatorPrivateKeys.map(
    (k) => secp256k1.ecdsaSign(checkpointHash, k).signature
  );

  const isDelivered = await isInboundMessageDelivered(
    ismParams,
    calculateMessageId(message)
  );
  if (isDelivered) {
    throw new Error("Message must not be delivered already");
  }

  const fee = await estimateInboundMessageFee(
    ismParams,
    checkpoint,
    signatures,
    isEmulated ? emulatedWallet : preprodWallet
  );
  if (fee < 300_000n) {
    throw new Error("Invalid fee? Fee too low.");
  }

  return await createInboundMessage(
    ismParams,
    checkpoint,
    signatures,
    isEmulated ? emulatedWallet : preprodWallet
  );
}

export async function testInboxOnEmulatedNetwork() {
  emulatedNetwork.tick(1n);
  await createInboundMsg(true);
}

export async function testInboxOnPreprodNetwork() {
  const txOutcome = await createInboundMsg();
  console.log(`Submitted inbound message at tx ${txOutcome.txId}!`);
  await waitForTxConfirmation(txOutcome.txId);

  const isDelivered = await isInboundMessageDelivered(
    ismParams,
    calculateMessageId(message)
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
