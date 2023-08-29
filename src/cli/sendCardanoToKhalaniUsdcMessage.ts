import type * as helios from "@hyperionbt/helios";
import "dotenv/config";
import { getProgramKhalaniTokens } from "../onchain/programs";
import { DOMAIN_CARDANO } from "../rpc/mock/cardanoDomain";
import { Address } from "../offchain/address";
import { type Wallet } from "../offchain/wallet";
import {
  createMessagePayloadBurn,
  MessagePayload,
} from "../offchain/messagePayload";
import { createWallet } from "./wallet";
import { H256 } from "../offchain/h256";
import { CardanoTokenName } from "../cardanoTokenName";
import { getIsmParamsHelios } from "../offchain/inbox";
import createOutboundMessage from "../offchain/tx/createOutboundMessage";
import {
  getOutboxUtxos,
  type OutboxUtxo,
} from "../offchain/indexer/getOutboxUtxos";
import { waitForTxConfirmation } from "../offchain/waitForTxConfirmation";
import { type Message } from "../offchain/message";

export const KHALANI_CHAIN_ID = 10012;

const khalaniProtocolRecipient = Address.fromHex(
  "0x0000000000000000000000000B7af337DEb05016Eff7a645daD0D56eDe7601A6"
);

const fujiRecipient = Address.fromHex(
  "0x0000000000000000000000002064dfa3a7dc4F6Bb6523B56Fa6C46611799058A"
);

async function prepareMessage(
  outboxUtxo: OutboxUtxo,
  senderWallet: Wallet
): Promise<Message> {
  const ismParamsHelios = getIsmParamsHelios();
  const nonce = outboxUtxo.message != null ? outboxUtxo.message.nonce + 1 : 0;
  const sender = Address.fromHex(
    `0x01000000${
      getProgramKhalaniTokens(ismParamsHelios).mintingPolicyHash.hex
    }`
  );
  const messagePayloadBurn = createMessagePayloadBurn({
    sender: H256.from(
      Buffer.from(`00000000${senderWallet.address.toHex().substring(2)}`, "hex")
    ),
    destinationChainId: KHALANI_CHAIN_ID,
    tokens: [[CardanoTokenName.fromTokenName("USDC"), 300500100200]],
    // TODO: fill in trades to actually bridge to FUJI.
    interchainLiquidityHubPayload: MessagePayload.empty(),
    isSwapWithAggregateToken: false,
    recipientAddress: H256.from(fujiRecipient.toBuffer()),
    message: MessagePayload.empty(),
  });
  return {
    version: 0,
    nonce,
    originDomain: DOMAIN_CARDANO,
    sender,
    destinationDomain: KHALANI_CHAIN_ID,
    recipient: khalaniProtocolRecipient,
    body: messagePayloadBurn,
  };
}

interface UsdcUtxo {
  utxo: helios.UTxO;
  amount: bigint;
}

async function findUsdcUtxos(wallet: Wallet): Promise<UsdcUtxo[]> {
  const walletUtxos = await wallet.getUtxos();
  const ismParamsHelios = getIsmParamsHelios();
  const programKhalaniTokens = getProgramKhalaniTokens(ismParamsHelios);
  const mintingPolicyHash = programKhalaniTokens.mintingPolicyHash;
  const usdcTokenName = CardanoTokenName.fromTokenName("USDC").toCardanoName();
  return walletUtxos.flatMap((utxo) =>
    utxo.value.assets
      .getTokens(mintingPolicyHash)
      .filter(([tokenName, _]) => tokenName.eq(usdcTokenName))
      .map(([_, value]) => ({
        utxo,
        amount: value.value,
      }))
  );
}

async function sendCardanoToKhalaniUsdcMessage() {
  const wallet = createWallet(
    process.env.DAPP_WALLET_ADDRESS,
    process.env.DAPP_WALLET_PRIVATE_KEY
  );
  const usdcUtxos = await findUsdcUtxos(wallet);
  const usdcBalance = usdcUtxos.reduce(
    (total, { amount }) => total + amount,
    0n
  );
  console.log(
    `Current USDC balance of ${wallet.address.toBech32()}: ${usdcBalance.toString()}`
  );
  const outboxAuthToken = process.env.OUTBOX_AUTH_TOKEN ?? "";
  const outboxUtxos = await getOutboxUtxos(outboxAuthToken);
  if (outboxUtxos.length !== 1) {
    throw new Error(
      `Outbox '${outboxAuthToken}' does not exist or is not unique: ${outboxUtxos.length} UTXOs found`
    );
  }
  const outboxUtxo = outboxUtxos[0];
  const message = await prepareMessage(outboxUtxo, wallet);
  const { utxoOutbox } = await createOutboundMessage(
    outboxUtxo.utxo,
    message,
    wallet
  );
  console.log(`Submit outbound message at tx ${utxoOutbox.txId.hex}`);
  await waitForTxConfirmation(utxoOutbox.txId);
}

async function main() {
  await sendCardanoToKhalaniUsdcMessage();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
