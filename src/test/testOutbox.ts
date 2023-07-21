import { calculateMessageId, type Message } from "../offchain/message";
import { DOMAIN_CARDANO } from "../rpc/mock/cardanoDomain";
import { Address } from "../offchain/address";
import { FUJI_DOMAIN } from "../rpc/mock/mockInitializer";
import { MessagePayload } from "../offchain/messagePayload";
import * as helios from "@hyperionbt/helios";
import createOutboundMessage from "../offchain/tx/createOutboundMessage";
import payOutboundRelayer from "../offchain/tx/payOutboundRelayer";
import createOutbox from "../offchain/tx/createOutbox";
import { waitForTxConfirmation } from "../offchain/waitForTxConfirmation";
import { getOutboundMessages } from "../offchain/indexer/getOutboundMessages";
import { emulatedNetwork, emulatedWallet, preprodWallet } from "./index";

const outboundRelayerAddress = new helios.Address(
  "addr_test1qr9u63th5pct502hfeknstzjx8hcdsm963wp3g62qvthd6ssfm0wz2twevrknhhx4vgyf84gpk00xae7w7f3yjr95lcq30jfed"
);

let lastOutboundMsg: Message = {
  version: 0,
  nonce: 0,
  originDomain: DOMAIN_CARDANO,
  sender: Address.fromHex(
    "0x0000000000000000000000000000000000000000000000000000000000000CA1"
  ),
  destinationDomain: FUJI_DOMAIN,
  recipient: Address.fromHex(
    "0x0000000000000000000000000000000000000000000000000000000000000EF1"
  ),
  message: MessagePayload.fromString(""),
};

interface OutboundMessageRes {
  messageId: helios.ByteArray;
  utxo: helios.UTxO;
}

async function createOutboundMsg(
  nonce: number,
  utxoOutbox: helios.UTxO,
  isEmulated: boolean = false
): Promise<OutboundMessageRes> {
  lastOutboundMsg = {
    ...lastOutboundMsg,
    nonce,
    message: MessagePayload.fromString(`[${Date.now()}] Outbound message!`),
  };
  const utxo = await createOutboundMessage(
    utxoOutbox,
    lastOutboundMsg,
    isEmulated ? emulatedWallet : preprodWallet
  );
  return {
    messageId: new helios.ByteArray(
      calculateMessageId(lastOutboundMsg).toByteArray()
    ),
    utxo,
  };
}

export async function testOutboxOnEmulatedNetwork() {
  emulatedNetwork.tick(1n);
  const emulatedUtxoOutbox = await createOutbox(emulatedWallet);
  emulatedNetwork.tick(1n);

  let createMsgRes = await createOutboundMsg(0, emulatedUtxoOutbox, true);
  emulatedNetwork.tick(1n);

  await payOutboundRelayer(
    emulatedWallet,
    outboundRelayerAddress,
    BigInt(10_000_000),
    createMsgRes.messageId
  );
  emulatedNetwork.tick(1n);

  createMsgRes = await createOutboundMsg(1, createMsgRes.utxo, true);
  emulatedNetwork.tick(1n);

  return await payOutboundRelayer(
    emulatedWallet,
    outboundRelayerAddress,
    BigInt(10_000_000),
    createMsgRes.messageId
  );
}

export async function testOutboxOnPreprodNetwork() {
  const preprodUtxoOutbox = await createOutbox(preprodWallet);
  console.log(`Create outbox at tx ${preprodUtxoOutbox.txId.hex}!`);
  await waitForTxConfirmation(preprodUtxoOutbox.txId.hex);

  let createMsgRes = await createOutboundMsg(0, preprodUtxoOutbox);
  console.log(
    `Submitted first outbound message at tx ${createMsgRes.utxo.txId.hex}!`
  );
  await waitForTxConfirmation(createMsgRes.utxo.txId.hex);

  let txId = await payOutboundRelayer(
    preprodWallet,
    outboundRelayerAddress,
    BigInt(10_000_000),
    createMsgRes.messageId
  );
  console.log(`Paid relayer for the first outbound message at tx ${txId.hex}!`);
  await waitForTxConfirmation(txId.hex);

  createMsgRes = await createOutboundMsg(1, createMsgRes.utxo);
  console.log(
    `Submitted second outbound message at tx ${createMsgRes.utxo.txId.hex}!`
  );
  await waitForTxConfirmation(createMsgRes.utxo.txId.hex);

  txId = await payOutboundRelayer(
    preprodWallet,
    outboundRelayerAddress,
    BigInt(10_000_000),
    createMsgRes.messageId
  );
  console.log(
    `Paid relayer for the second outbound message at tx ${txId.hex}!`
  );
  await waitForTxConfirmation(txId.hex);

  // Note: Not all messages are "text".
  const outboundMessages = (await getOutboundMessages()).map((m) =>
    helios.bytesToText(m.bytes)
  );
  console.log("(Latest) Outbound Messages:", outboundMessages);
  if (
    outboundMessages[outboundMessages.length - 1] !==
    helios.bytesToText([...lastOutboundMsg.message.toBuffer()])
  ) {
    throw new Error("Outbound message not found");
  }
}
