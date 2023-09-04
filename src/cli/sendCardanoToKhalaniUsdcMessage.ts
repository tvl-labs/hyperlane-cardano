import type * as helios from "@hyperionbt/helios";
import "dotenv/config";
import { getProgramKhalaniTokens } from "../onchain/programs";
import { type Wallet } from "../offchain/wallet";
import { createWallet } from "./wallet";
import { CardanoTokenName } from "../cardanoTokenName";
import { getIsmParamsHelios } from "../offchain/inbox";
import {
  prepareOutboundMessage,
  createOutboundMessage,
} from "../offchain/tx/createOutboundMessage";
import { getOutboxUtxos } from "../offchain/indexer/getOutboxUtxos";
import { waitForTxConfirmation } from "../offchain/blockfrost/waitForTxConfirmation";
import { getOutboundKhalaniUTxO } from "../offchain/indexer/getOutboundKhalaniUTxO";

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
  const ismParamsHelios = getIsmParamsHelios();
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
  const message = await prepareOutboundMessage(outboxUtxo, wallet);
  const khalaniUtxo = await getOutboundKhalaniUTxO();
  const { utxoOutbox } = await createOutboundMessage(
    outboxUtxo.utxo,
    message,
    wallet,
    ismParamsHelios,
    khalaniUtxo
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
