import * as helios from "@hyperionbt/helios";
import paramsPreprod from "../../../data/cardano-preprod-params.json";
import MintingPolicyIsmMultiSig from "../../onchain/ismMultiSig.hl";
import MintingPolicyKhalaniTokens from "../../onchain/mpKhalaniTokens.hl";
import { getProgramOutbox } from "../../onchain/programs";
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

  const payloadBurn = parseMessagePayloadBurn(outboxMessage.body);
  if (payloadBurn != null) {
    if (ismParams == null) {
      throw new Error("Need ISM Params");
    }

    const ismMultiSig = new MintingPolicyIsmMultiSig(ismParams).compile(true);
    const mpKhalaniTokens = new MintingPolicyKhalaniTokens({
      ISM_KHALANI: ismMultiSig.mintingPolicyHash,
    }).compile(true);
    tx.attachScript(mpKhalaniTokens);
    const mintKhalaniTokens: [number[], number][] = payloadBurn.tokens.map(
      (token) => [helios.hexToBytes(token[0].substring(2)), -token[1]]
    );
    tx.mintTokens(
      mpKhalaniTokens.mintingPolicyHash,
      mintKhalaniTokens,
      new helios.ConstrData(0, [])
    );
  }

  // TODO: Better coin selection for end users
  const utxos = await wallet.getUtxos();
  tx.addInputs(utxos);

  tx.addInput(
    utxoOutbox,
    new helios.ConstrData(payloadBurn !== null ? 1 : 0, [])
  );
  const scriptOutbox = getProgramOutbox(ismParams);
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
