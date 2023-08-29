import * as helios from "@hyperionbt/helios";
import paramsPreprod from "../../../data/cardano-preprod-params.json";
import {
  getProgramOutbox,
  getProgramKhalaniTokens,
  getProgramKhalani,
} from "../../onchain/programs";
import type { Wallet } from "../wallet";
import {
  deserializeOutboxDatum,
  serializeOutboxDatum,
} from "../outbox/outboxDatum";
import { calculateMessageId, type Message } from "../message";
import { parseMessagePayloadBurn } from "../messagePayload";
import type { IsmParamsHelios } from "../inbox/ismParams";
import { Address } from "../../offchain/address";
import {
  createMessagePayloadBurn,
  MessagePayload,
} from "../../offchain/messagePayload";
import { H256 } from "../../offchain/h256";
import { CardanoTokenName } from "../../cardanoTokenName";
import { type OutboxUtxo } from "../../offchain/indexer/getOutboxUtxos";
import { DOMAIN_CARDANO } from "../../rpc/mock/cardanoDomain";

// TODO: Read from env/args?
export const KHALANI_CHAIN_ID = 10012;

const khalaniProtocolRecipient = Address.fromHex(
  "0x0000000000000000000000000B7af337DEb05016Eff7a645daD0D56eDe7601A6"
);

const fujiRecipient = Address.fromHex(
  "0x0000000000000000000000002064dfa3a7dc4F6Bb6523B56Fa6C46611799058A"
);

export async function prepareOutboundMessage(
  outboxUtxo: OutboxUtxo,
  senderWallet: Wallet,
  redeemAmount = 1_000_000
): Promise<Message> {
  const nonce = outboxUtxo.message != null ? outboxUtxo.message.nonce + 1 : 0;
  const sender = Address.fromValidatorHash(getProgramKhalani().validatorHash);
  const messagePayloadBurn = createMessagePayloadBurn({
    sender: H256.from(
      Buffer.from(
        `00000000${senderWallet.addressPubKeyOnly.toHex().substring(2)}`,
        "hex"
      )
    ),
    destinationChainId: KHALANI_CHAIN_ID,
    tokens: [[CardanoTokenName.fromTokenName("USDC"), redeemAmount]],
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

export async function buildOutboundMessage(
  utxoOutbox: helios.UTxO,
  outboxMessage: Message,
  wallet: Wallet,
  ismParams?: IsmParamsHelios,
  utxoKhalani?: helios.UTxO
): Promise<helios.Tx> {
  const { merkleTree } = deserializeOutboxDatum(utxoOutbox);

  const messageId = calculateMessageId(outboxMessage);
  merkleTree.ingest(messageId);

  const tx = new helios.Tx();

  const sender = outboxMessage.sender.toHex().substring(2);
  // Payment credential
  if (sender.startsWith("00")) {
    tx.addSigner(new helios.PubKeyHash(sender.substring(8)));
  }

  // TODO: Better coin selection for end users
  const utxos = await wallet.getUtxos();
  tx.addInputs(utxos);

  tx.addInput(utxoOutbox, new helios.ConstrData(0, []));
  const scriptOutbox = getProgramOutbox();
  tx.attachScript(scriptOutbox);
  tx.addOutput(
    new helios.TxOutput(
      helios.Address.fromValidatorHash(scriptOutbox.validatorHash),
      helios.Value.fromCbor(utxoOutbox.origOutput.value.toCbor()),
      helios.Datum.inline(serializeOutboxDatum(merkleTree, outboxMessage))
    )
  );

  if (utxoKhalani != null) {
    tx.addInput(utxoKhalani, new helios.ConstrData(0, []));
    const programKhalani = getProgramKhalani(ismParams);
    tx.attachScript(programKhalani);
    tx.addOutput(utxoKhalani.origOutput);

    const programKhalaniTokens = getProgramKhalaniTokens(ismParams);
    tx.attachScript(programKhalaniTokens);

    const payloadBurn = parseMessagePayloadBurn(outboxMessage.body);
    const mintKhalaniTokens: [number[], number][] = payloadBurn.tokens.map(
      (token) => [token[0].toCardanoName(), -token[1]]
    );
    tx.mintTokens(
      programKhalaniTokens.mintingPolicyHash,
      mintKhalaniTokens,
      new helios.MapData([])
    );
    tx.addSigner(new helios.PubKeyHash(payloadBurn.sender.hex().substring(10)));
  }

  await tx.finalize(new helios.NetworkParams(paramsPreprod), wallet.address);
  return tx;
}

export async function createOutboundMessage(
  utxoOutbox: helios.UTxO,
  outboxMessage: Message,
  wallet: Wallet,
  ismParams?: IsmParamsHelios,
  utxoKhalani?: helios.UTxO
): Promise<{
  utxoOutbox: helios.UTxO;
  utxoKhalani?: helios.UTxO;
}> {
  const tx = await buildOutboundMessage(
    utxoOutbox,
    outboxMessage,
    wallet,
    ismParams,
    utxoKhalani
  );
  tx.addSignatures(await wallet.signTx(tx));
  const txId = await wallet.submitTx(tx);

  return {
    utxoOutbox: new helios.UTxO(txId, 0n, tx.body.outputs[0]),
    utxoKhalani:
      utxoKhalani != null
        ? new helios.UTxO(txId, 1n, utxoKhalani.origOutput)
        : undefined,
  };
}
