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

export default async function createOutboundMessage(
  utxoOutbox: helios.UTxO,
  outboxMessage: Message,
  wallet: Wallet,
  ismParams?: IsmParamsHelios,
  utxoKhalani?: helios.UTxO
): Promise<{
  utxoOutbox: helios.UTxO;
  utxoKhalani?: helios.UTxO;
}> {
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
