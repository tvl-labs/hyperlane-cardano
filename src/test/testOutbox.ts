import type { Wallet } from "../offchain/wallet";
import { calculateMessageId, type Message } from "../offchain/message";
import { DOMAIN_CARDANO } from "../rpc/mock/cardanoDomain";
import { Address } from "../offchain/address";
import { FUJI_DOMAIN } from "../rpc/mock/mockInitializer";
import {
  createMessagePayloadBurn,
  MessagePayload,
} from "../offchain/messagePayload";
import * as helios from "@hyperionbt/helios";
import createOutboundMessage from "../offchain/tx/createOutboundMessage";
import payOutboundRelayer from "../offchain/tx/payOutboundRelayer";
import createOutbox from "../offchain/tx/createOutbox";
import { waitForTxConfirmation } from "../offchain/waitForTxConfirmation";
import { getOutboundGasPayment } from "../offchain/indexer/getOutboundGasPayment";
import {
  emulatedNetwork,
  emulatedDappWallet,
  preprodDappWallet,
  preprodRelayerWallet,
} from "./index";
import { H256 } from "../offchain/h256";
import { getProgramKhalaniTokens } from "../onchain/programs";
import type { IsmParamsHelios } from "../offchain/inbox/ismParams";
import { CardanoTokenName } from "../cardanoTokenName";
import { getOutboxUtxos } from '../offchain/indexer/getOutboxUtxos';

const recipient = Address.fromHex(
  "0x0000000000000000000000000000000000000000000000000000000000000EF1"
);

let lastOutboundMsg: Message;

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
    version: 0,
    nonce,
    originDomain: DOMAIN_CARDANO,
    sender: Address.fromHex(
      `0x01000000${getProgramKhalaniTokens(ismParams).mintingPolicyHash.hex}`
    ),
    destinationDomain: FUJI_DOMAIN,
    recipient,
    body: createMessagePayloadBurn({
      sender: H256.from(
        Buffer.from(`00000000${wallet.address.toHex().substring(2)}`, "hex")
      ),
      destinationChainId: FUJI_DOMAIN,
      tokens: [[CardanoTokenName.fromTokenName("USDC"), nonce + 7]],
      interchainLiquidityHubPayload: MessagePayload.fromHexString("0x333444"),
      isSwapWithAggregateToken: false,
      recipientAddress: H256.from(recipient.toBuffer()),
      // We want a unique message every run to test relayer payment
      message: MessagePayload.fromHexString(
        H256.fromHex(
          `0x00000000000000000000000000000000000000000000000000000000${Date.now()
            .toString(16)
            .slice(0, 8)}`
        ).hex()
      ),
    }),
  };
  const utxo = await createOutboundMessage(
    utxoOutbox,
    lastOutboundMsg,
    wallet,
    ismParams
  );
  return {
    messageId: new helios.ByteArray(
      calculateMessageId(lastOutboundMsg).toByteArray()
    ),
    utxo,
  };
}

export async function testOutboxOnEmulatedNetwork(ismParams: IsmParamsHelios) {
  emulatedNetwork.tick(1n);
  const { utxo: emulatedUtxoOutbox } = await createOutbox(emulatedDappWallet);
  emulatedNetwork.tick(1n);

  let createMsgRes = await createOutboundMsg(
    ismParams,
    0,
    emulatedUtxoOutbox,
    emulatedDappWallet
  );
  emulatedNetwork.tick(1n);

  await payOutboundRelayer(
    emulatedDappWallet,
    preprodRelayerWallet.address,
    BigInt(10_000_000),
    createMsgRes.messageId
  );
  emulatedNetwork.tick(1n);

  createMsgRes = await createOutboundMsg(
    ismParams,
    1,
    createMsgRes.utxo,
    emulatedDappWallet
  );
  emulatedNetwork.tick(1n);

  return await payOutboundRelayer(
    emulatedDappWallet,
    preprodRelayerWallet.address,
    BigInt(10_000_000),
    createMsgRes.messageId
  );
}

export async function testOutboxOnPreprodNetwork(ismParams: IsmParamsHelios) {
  const { utxo: preprodUtxoOutbox, outboxAuthToken } = await createOutbox(preprodRelayerWallet);
  console.log(`Create outbox at tx ${preprodUtxoOutbox.txId.hex}!`);
  await waitForTxConfirmation(preprodUtxoOutbox.txId);

  let createMsgRes = await createOutboundMsg(
    ismParams,
    0,
    preprodUtxoOutbox,
    preprodDappWallet
  );
  console.log(
    `Submit first outbound message at tx ${createMsgRes.utxo.txId.hex}!`
  );
  await waitForTxConfirmation(createMsgRes.utxo.txId);

  let paidGas = await getOutboundGasPayment(
    preprodRelayerWallet.address,
    createMsgRes.messageId
  );
  if (paidGas !== BigInt(0)) {
    throw new Error("Expect unpaid outbound message");
  }

  const gas = BigInt(10_000_000);
  let txId = await payOutboundRelayer(
    preprodDappWallet,
    preprodRelayerWallet.address,
    gas,
    createMsgRes.messageId
  );
  console.log(`Pay relayer for the first outbound message at tx ${txId.hex}!`);
  await waitForTxConfirmation(txId);

  paidGas = await getOutboundGasPayment(
    preprodRelayerWallet.address,
    createMsgRes.messageId
  );
  if (paidGas !== gas) {
    throw new Error("Expect paid outbound message");
  }

  createMsgRes = await createOutboundMsg(
    ismParams,
    1,
    createMsgRes.utxo,
    preprodDappWallet
  );
  console.log(
    `Submit second outbound message at tx ${createMsgRes.utxo.txId.hex}!`
  );
  await waitForTxConfirmation(createMsgRes.utxo.txId);

  txId = await payOutboundRelayer(
    preprodDappWallet,
    preprodRelayerWallet.address,
    BigInt(10_000_000),
    createMsgRes.messageId
  );
  console.log(`Pay relayer for the second outbound message at tx ${txId.hex}!`);
  await waitForTxConfirmation(txId);

  paidGas = await getOutboundGasPayment(
    preprodRelayerWallet.address,
    createMsgRes.messageId
  );
  if (paidGas !== gas) {
    throw new Error("Expect paid outbound message");
  }

  const outboxUtxos = await getOutboxUtxos(outboxAuthToken);
  if (outboxUtxos.length !== 1) {
    throw new Error(`Outbox '${outboxAuthToken}' does not exist or is not unique: ${outboxUtxos.length} UTXOs found`);
  }
  const outboxUtxo = outboxUtxos[0];
  const outboxMessage = outboxUtxo.message;
  if (outboxMessage == null) {
    throw new Error(`Outbox '${outboxAuthToken}' message does not exist`);
  }
  if (JSON.stringify(outboxMessage) !== JSON.stringify(lastOutboundMsg)) {
    console.error('Expected message', JSON.stringify(lastOutboundMsg));
    console.error('Actual message', JSON.stringify(outboxMessage));
    throw new Error('Outbox messages is not found');
  }
}
