import * as helios from "@hyperionbt/helios";
import paramsPreprod from "../../../data/cardano-preprod-params.json";
import {
  getProgramOutbox,
  getProgramKhalaniTokens,
} from "../../onchain/programs";
import type { Wallet } from "../wallet";
import {
  deserializeOutboxDatum,
  serializeOutboxDatum,
} from "../outbox/outboxDatum";
import { calculateMessageId, type Message } from "../message";
import { parseMessagePayloadBurn } from "../messagePayload";
import type { IsmParamsHelios } from "../inbox/ismParams";

export default async function createOutboundMessage(
  utxoOutbox: helios.UTxO,
  outboxMessage: Message,
  wallet: Wallet,
  ismParams?: IsmParamsHelios
): Promise<helios.UTxO> {
  const { merkleTree } = deserializeOutboxDatum(utxoOutbox);

  const messageId = calculateMessageId(outboxMessage);
  merkleTree.ingest(messageId);

  const tx = new helios.Tx();

  const sender = outboxMessage.sender.toHex().substring(2);
  // Payment credential
  if (sender.startsWith("00")) {
    tx.addSigner(new helios.PubKeyHash(sender.substring(8)));
  }
  // Minting policy, only supporting Khalani
  else if (sender.startsWith("01")) {
    const programKhalaniTokens = getProgramKhalaniTokens(ismParams);
    if (sender !== `01000000${programKhalaniTokens.mintingPolicyHash.hex}`) {
      throw new Error("Unsupported minting policy");
    }
    tx.attachScript(programKhalaniTokens);

    const payloadBurn = parseMessagePayloadBurn(outboxMessage.body);
    const mintKhalaniTokens: [number[], number][] = payloadBurn.tokens.map(
      (token) => [helios.hexToBytes(token[0].substring(2)), -token[1]]
    );
    tx.mintTokens(
      programKhalaniTokens.mintingPolicyHash,
      mintKhalaniTokens,
      new helios.ConstrData(0, [])
    );
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

  await tx.finalize(new helios.NetworkParams(paramsPreprod), wallet.address);

  tx.addSignatures(await wallet.signTx(tx));

  const txId = await wallet.submitTx(tx);

  return new helios.UTxO(txId, 0n, tx.body.outputs[0]);
}
