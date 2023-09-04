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
import { FUJI_DOMAIN } from "../../rpc/mock/mockInitializer";

// TODO: Read from env/args?
export const KHALANI_CHAIN_ID = 10012;

const khalaniProtocolRecipient = Address.fromHex(
  "0x000000000000000000000000e676E5f0f1e2E162F6B95577E2603638159a7C9B"
);

const fujiRecipient = Address.fromHex(
  "0x0000000000000000000000002064dfa3a7dc4F6Bb6523B56Fa6C46611799058A"
);

export async function prepareOutboundMessage(
  outboxUtxo: OutboxUtxo,
  senderWallet: Wallet,
  redeemAmount = 2_000_000
): Promise<Message> {
  const nonce = outboxUtxo.message != null ? outboxUtxo.message.nonce + 1 : 0;
  const sender = Address.fromValidatorHash(getProgramKhalani().validatorHash);
  // TODO: this payload explicitly hard-codes 2.000.000 of klnUSDC to be swapped to USDC.fuji
  //  We will have a full fledged integration with Khalani SDK to allow for customizing this value.
  const interchainLiquidityHubPayload = MessagePayload.fromHexString(
    "0x642182f300000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000014000000000000000000000000000000000000000000000000000000000000001a0000000000000000000000000000000000000000000000000000000006e5a767f0000000000000000000000000000000000000000000000000000000000000080b50dc24e616bc0b90c6e12b935e43ed21a54be9a000000000000000000000004000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000001bc16d674ec800000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000875863d88bf0c9a088a274a0263a903434b306aa00000000000000000000000088aa6c2584b2095cfa0e0cd3234b738125f7735400000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000001bc16d674ec80000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe1e3ca"
  );
  const messagePayloadBurn = createMessagePayloadBurn({
    sender: H256.from(
      Buffer.from(
        `00000000${senderWallet.addressPubKeyOnly.toHex().substring(2)}`,
        "hex"
      )
    ),
    destinationChainId: FUJI_DOMAIN,
    tokens: [[CardanoTokenName.fromTokenName("USDC"), redeemAmount]],
    interchainLiquidityHubPayload,
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
