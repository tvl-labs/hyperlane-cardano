import { type Message } from "../offchain/message";
import { DOMAIN_CARDANO } from "../rpc/mock/cardanoDomain";
import { Address } from "../offchain/address";
import { FUJI_DOMAIN } from "../rpc/mock/mockInitializer";
import { MessagePayload } from "../offchain/messagePayload";
import * as helios from "@hyperionbt/helios";
import createOutboundMessage from "../offchain/tx/createOutboundMessage";
import createOutbox from "../offchain/tx/createOutbox";
import { waitForTxConfirmation } from "../offchain/waitForTxConfirmation";
import { getOutboundMessages } from "../offchain/indexer/getOutboundMessages";
import { emulatedNetwork, emulatedWallet, preprodWallet } from "./index";

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

async function createOutboundMsg(
  nonce: number,
  utxoOutbox: helios.UTxO,
  isEmulated: boolean = false
): Promise<helios.UTxO> {
  lastOutboundMsg = {
    ...lastOutboundMsg,
    nonce,
    message: MessagePayload.fromString(`[${Date.now()}] Outbound message!`),
  };
  return await createOutboundMessage(
    utxoOutbox,
    lastOutboundMsg,
    isEmulated ? emulatedWallet : preprodWallet
  );
}

export async function testOutboxOnEmulatedNetwork() {
  emulatedNetwork.tick(1n);
  let emulatedUtxoOutbox = await createOutbox(emulatedWallet);
  emulatedNetwork.tick(1n);

  emulatedUtxoOutbox = await createOutboundMsg(0, emulatedUtxoOutbox, true);
  emulatedNetwork.tick(1n);

  return await createOutboundMsg(1, emulatedUtxoOutbox, true);
}

export async function testOutboxOnPreprodNetwork() {
  let preprodUtxoOutbox = await createOutbox(preprodWallet);
  console.log(`Create outbox at tx ${preprodUtxoOutbox.txId.hex}!`);
  await waitForTxConfirmation(preprodUtxoOutbox.txId.hex);

  preprodUtxoOutbox = await createOutboundMsg(0, preprodUtxoOutbox);
  console.log(
    `Submitted first outbound message at tx ${preprodUtxoOutbox.txId.hex}!`
  );
  await waitForTxConfirmation(preprodUtxoOutbox.txId.hex);

  preprodUtxoOutbox = await createOutboundMsg(1, preprodUtxoOutbox);
  console.log(
    `Submitted second outbound message at tx ${preprodUtxoOutbox.txId.hex}!`
  );
  await waitForTxConfirmation(preprodUtxoOutbox.txId.hex);

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
