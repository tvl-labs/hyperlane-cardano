import { waitForTxConfirmation } from "../offchain/waitForTxConfirmation";
import { getInboundMessages } from "../offchain/indexer/getInboundMessages";
import * as helios from "@hyperionbt/helios";
import { emulatedNetwork, emulatedWallet, preprodWallet } from "./index";
import secp256k1 from "secp256k1";
import { Address } from "../offchain/address";
import type { Wallet } from "../offchain/wallet";
import { MessagePayload } from "../offchain/messagePayload";
import { DOMAIN_CARDANO } from "../rpc/mock/cardanoDomain";
import { FUJI_DOMAIN } from "../rpc/mock/mockInitializer";
import {
  isInboundMessageDelivered,
  estimateInboundMessageFee,
  createInboundMessage,
  processInboundMessage,
} from "../offchain/inbox";
import { type Checkpoint, hashCheckpoint } from "../offchain/checkpoint";
import { calculateMessageId, type Message } from "../offchain/message";
import type { IsmParamsHelios } from "../offchain/inbox/ismParams";
import createInbox from "../offchain/tx/createInbox";

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

// TODO: Better interface & names here...
async function createInboundMsg(
  wallet: Wallet,
  ismParams: IsmParamsHelios,
  utxoInbox: helios.UTxO
) {
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
    utxoInbox,
    checkpoint,
    signatures,
    wallet
  );
  if (fee < 300_000n) {
    throw new Error("Invalid fee? Fee too low.");
  }

  return await createInboundMessage(
    ismParams,
    utxoInbox,
    checkpoint,
    signatures,
    wallet
  );
}

export async function testInboxOnEmulatedNetwork() {
  emulatedNetwork.tick(1n);
  const { ismParams, utxoInbox } = await createInbox(emulatedWallet);
  emulatedNetwork.tick(1n);
  const { utxoMessage } = await createInboundMsg(
    emulatedWallet,
    ismParams,
    utxoInbox
  );
  emulatedNetwork.tick(1n);
  await processInboundMessage(ismParams, utxoMessage, emulatedWallet);
}

export async function testInboxOnPreprodNetwork() {
  const { ismParams, utxoInbox } = await createInbox(preprodWallet);
  console.log(`Created inbox at tx ${utxoInbox.txId.hex}!`);
  await waitForTxConfirmation(utxoInbox.txId.hex);

  const txOutcome = await createInboundMsg(preprodWallet, ismParams, utxoInbox);
  console.log(
    `Submitted inbound message at tx ${txOutcome.utxoMessage.txId.hex}!`
  );
  await waitForTxConfirmation(txOutcome.utxoMessage.txId.hex);

  let isDelivered = await isInboundMessageDelivered(
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

  const txId = await processInboundMessage(
    ismParams,
    txOutcome.utxoMessage,
    preprodWallet
  );
  console.log(`Processed inbound message at tx ${txId.hex}!`);
  await waitForTxConfirmation(txId.hex);

  isDelivered = await isInboundMessageDelivered(
    ismParams,
    calculateMessageId(message)
  );
  if (!isDelivered) {
    throw new Error(
      "Message must still have been delivered after being burned"
    );
  }
}
