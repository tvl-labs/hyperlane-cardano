import type { Wallet } from "../offchain/wallet";
import { calculateMessageId, type Message } from "../offchain/message";
import { DOMAIN_CARDANO } from "../rpc/mock/cardanoDomain";
import { Address } from "../offchain/address";
import { FUJI_DOMAIN } from "../rpc/mock/mockInitializer";
import {
  MessagePayload,
  createMessagePayloadBurn,
} from "../offchain/messagePayload";
import * as helios from "@hyperionbt/helios";
import createOutboundMessage from "../offchain/tx/createOutboundMessage";
import payOutboundRelayer from "../offchain/tx/payOutboundRelayer";
import createOutbox from "../offchain/tx/createOutbox";
import { waitForTxConfirmation } from "../offchain/waitForTxConfirmation";
import { getOutboundMessages } from "../offchain/indexer/getOutboundMessages";
import { getOutboundGasPayment } from "../offchain/indexer/getOutboundGasPayment";
import { emulatedNetwork, emulatedWallet, preprodWallet } from "./index";
import type { IsmParamsHelios } from "../offchain/inbox/ismParams";
import { H256 } from "../merkle/h256";

const outboundRelayerAddress = new helios.Address(
  "addr_test1qr9u63th5pct502hfeknstzjx8hcdsm963wp3g62qvthd6ssfm0wz2twevrknhhx4vgyf84gpk00xae7w7f3yjr95lcq30jfed"
);

// USDC "burner"
const senderAddress = new helios.Address(
  "addr_test1qzq0qn4kywltmn37zc4gsgemuc9rjmz6pdrevklyvl8fg4k7ev8utalf2nv8976mcvy8rgdfssjvd9aaae4w93cp980q6xt9dc"
);
const senderAddressHash = Address.fromHex(
  `0x${helios.bytesToHex(helios.Crypto.blake2b(senderAddress.bytes))}`
);
const recipient = Address.fromHex(
  "0x0000000000000000000000000000000000000000000000000000000000000EF1"
);

let lastOutboundMsg: Message = {
  version: 0,
  nonce: 0,
  originDomain: DOMAIN_CARDANO,
  sender: senderAddressHash,
  destinationDomain: FUJI_DOMAIN,
  recipient,
  body: MessagePayload.fromString(""),
};

interface OutboundMessageRes {
  messageId: helios.ByteArray;
  utxo: helios.UTxO;
}

async function createOutboundMsg(
  ismParams: IsmParamsHelios,
  nonce: number,
  utxoOutbox: helios.UTxO,
  wallet: Wallet
): Promise<OutboundMessageRes> {
  lastOutboundMsg = {
    ...lastOutboundMsg,
    nonce,
    body: createMessagePayloadBurn({
      senderAddressHash: H256.from(senderAddressHash.toBuffer()),
      destinationChainId: FUJI_DOMAIN,
      tokens: [["0x55534443", 1]],
      interchainLiquidityHubPayload: "0x",
      isSwapWithAggregateToken: false,
      recipientAddress: H256.from(recipient.toBuffer()),
      message: "0x",
    }),
  };
  // TODO: Burn the Khalani tokens with minting policy inferred from the ISM Params
  const utxo = await createOutboundMessage(utxoOutbox, lastOutboundMsg, wallet);
  return {
    messageId: new helios.ByteArray(
      calculateMessageId(lastOutboundMsg).toByteArray()
    ),
    utxo,
  };
}

export async function testOutboxOnEmulatedNetwork(ismParams: IsmParamsHelios) {
  emulatedNetwork.tick(1n);
  const emulatedUtxoOutbox = await createOutbox(emulatedWallet);
  emulatedNetwork.tick(1n);

  let createMsgRes = await createOutboundMsg(
    ismParams,
    0,
    emulatedUtxoOutbox,
    emulatedWallet
  );
  emulatedNetwork.tick(1n);

  await payOutboundRelayer(
    emulatedWallet,
    outboundRelayerAddress,
    BigInt(10_000_000),
    createMsgRes.messageId
  );
  emulatedNetwork.tick(1n);

  createMsgRes = await createOutboundMsg(
    ismParams,
    1,
    createMsgRes.utxo,
    emulatedWallet
  );
  emulatedNetwork.tick(1n);

  return await payOutboundRelayer(
    emulatedWallet,
    outboundRelayerAddress,
    BigInt(10_000_000),
    createMsgRes.messageId
  );
}

export async function testOutboxOnPreprodNetwork(ismParams: IsmParamsHelios) {
  const preprodUtxoOutbox = await createOutbox(preprodWallet);
  console.log(`Create outbox at tx ${preprodUtxoOutbox.txId.hex}!`);
  await waitForTxConfirmation(preprodUtxoOutbox.txId.hex);

  let createMsgRes = await createOutboundMsg(
    ismParams,
    0,
    preprodUtxoOutbox,
    preprodWallet
  );
  console.log(
    `Submitted first outbound message at tx ${createMsgRes.utxo.txId.hex}!`
  );
  await waitForTxConfirmation(createMsgRes.utxo.txId.hex);

  let paidGas = await getOutboundGasPayment(
    outboundRelayerAddress,
    createMsgRes.messageId
  );
  if (paidGas !== BigInt(0)) {
    throw new Error("Expect unpaid outbound message");
  }

  const gas = BigInt(10_000_000);
  let txId = await payOutboundRelayer(
    preprodWallet,
    outboundRelayerAddress,
    gas,
    createMsgRes.messageId
  );
  console.log(`Paid relayer for the first outbound message at tx ${txId.hex}!`);
  await waitForTxConfirmation(txId.hex);

  paidGas = await getOutboundGasPayment(
    outboundRelayerAddress,
    createMsgRes.messageId
  );
  if (paidGas !== gas) {
    throw new Error("Expect paid outbound message");
  }

  createMsgRes = await createOutboundMsg(
    ismParams,
    1,
    createMsgRes.utxo,
    preprodWallet
  );
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

  paidGas = await getOutboundGasPayment(
    outboundRelayerAddress,
    createMsgRes.messageId
  );
  if (paidGas !== gas) {
    throw new Error("Expect paid outbound message");
  }

  const outboundMessages = await getOutboundMessages();
  if (
    outboundMessages[outboundMessages.length - 1].hex !==
    lastOutboundMsg.body.toHex().substring(2)
  ) {
    throw new Error("Outbound message not found");
  }
}
