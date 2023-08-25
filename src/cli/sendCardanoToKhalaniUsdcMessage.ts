import * as helios from "@hyperionbt/helios";
import "dotenv/config";
import fetch from "node-fetch";
import { getProgramKhalaniTokens, getProgramOutbox } from "../onchain/programs";
import createOutboundMessage from "../offchain/tx/createOutboundMessage";
import {
  blockfrostPrefix,
  blockfrostProjectId,
} from "../offchain/indexer/blockfrost";
import { waitForTxConfirmation } from "../offchain/waitForTxConfirmation";
import { DOMAIN_CARDANO } from "../rpc/mock/cardanoDomain";
import { Address } from "../offchain/address";
import { type Wallet } from "../offchain/wallet";
import {
  createMessagePayloadBurn,
  MessagePayload,
} from "../offchain/messagePayload";
import { parseBlockfrostUtxos } from "../offchain/indexer/parseBlockfrostUtxos";
import { createWallet } from "./wallet";
import { H256 } from "../offchain/h256";
import { CardanoTokenName } from "../cardanoTokenName";
import { getIsmParamsHelios } from "../offchain/inbox";
import { KHALANI_CHAIN_ID } from "./sendKhalaniToCardanoUsdcMintMessage";

// TODO: set.
const khalaniProtocolRecipient = Address.fromHex(
  "0x0000000000000000000000000000000000000000000000000000000000000EF1"
);

// TODO: set.
const fujiRecipient = Address.fromHex(
  "0x0000000000000000000000000000000000000000000000000000000000000EF1"
);

async function fetchOutboxUtxo(): Promise<helios.UTxO> {
  const addressOutbox = helios.Address.fromValidatorHash(
    getProgramOutbox().validatorHash
  );

  const utxos: any = await fetch(
    `${blockfrostPrefix}/addresses/${addressOutbox.toBech32()}/utxos/${
      process.env.OUTBOX_AUTH_TOKEN ?? ""
    }`,
    {
      headers: {
        project_id: blockfrostProjectId,
      },
    }
  ).then(async (r) => await r.json());

  const parsedUtxos = await parseBlockfrostUtxos(utxos, addressOutbox);
  if (parsedUtxos.length !== 1) {
    throw new Error(`Expected only one UTXO but found ${parsedUtxos.length}`);
  }
  return parsedUtxos[0];
}

async function prepareMessage(outboxUtxo: helios.UTxO, senderWallet: Wallet) {
  const ismParamsHelios = getIsmParamsHelios();
  const nonce = Number(outboxUtxo.origOutput.datum.data.list[0].list[1].int);
  return {
    version: 0,
    nonce,
    originDomain: DOMAIN_CARDANO,
    sender: Address.fromHex(
      `0x01000000${
        getProgramKhalaniTokens(ismParamsHelios).mintingPolicyHash.hex
      }`
    ),
    destinationDomain: KHALANI_CHAIN_ID,
    recipient: khalaniProtocolRecipient,
    body: createMessagePayloadBurn({
      sender: H256.from(
        Buffer.from(
          `00000000${senderWallet.address.toHex().substring(2)}`,
          "hex"
        )
      ),
      destinationChainId: KHALANI_CHAIN_ID,
      tokens: [[CardanoTokenName.fromTokenName("USDC"), 3]],
      // TODO: set.
      interchainLiquidityHubPayload: MessagePayload.empty(),
      isSwapWithAggregateToken: false,
      recipientAddress: H256.from(fujiRecipient.toBuffer()),
      // We want a unique message every run to test relayer payment
      message: MessagePayload.empty(),
    }),
  };
}

async function sendCardanoToKhalaniUsdcMessage() {
  const wallet = createWallet();
  const outboxUtxo = await fetchOutboxUtxo();
  const message = await prepareMessage(outboxUtxo, wallet);
  const utxo = await createOutboundMessage(outboxUtxo, message, wallet);
  console.log(`Submit outbound message at tx ${utxo.txId.hex}`);
  await waitForTxConfirmation(utxo.txId);
}

async function main() {
  await sendCardanoToKhalaniUsdcMessage();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
