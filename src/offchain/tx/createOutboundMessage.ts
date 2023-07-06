import * as helios from "@hyperionbt/helios";
import paramsPreview from "../../../data/cardano-preview-params.json";
import ScriptOutbox from "../../onchain/scriptOutbox.hl";
import { getWalletInfo } from "../wallet";
import {
  deserializeOutboxDatum,
  serializeOutboxDatum,
} from "../outbox/outboxDatum";
import {
  calculateMessageId,
  type OutboxMessage,
} from "../outbox/outboxMessage";
import { serializeOutboxRedeemer } from "../outbox/outboxMessageSerialize";

export default async function createOutboundMessage(
  utxoOutbox: helios.UTxO,
  outboxMessage: OutboxMessage,
  relayerWallet: helios.Wallet,
  blockfrost?: helios.BlockfrostV0
): Promise<helios.UTxO> {
  const { merkleTree } = deserializeOutboxDatum(utxoOutbox);

  const messageId = calculateMessageId(outboxMessage);
  merkleTree.ingest(messageId);

  const tx = new helios.Tx();

  const { baseAddress, utxos } = await getWalletInfo(relayerWallet, blockfrost);
  tx.addInputs(utxos);
  for (let i = 0; i < 3 && i < utxos.length; i++) {
    if (!utxos[i].value.assets.isZero()) continue;
    tx.addCollateral(utxos[i]);
  }

  tx.addInput(utxoOutbox, serializeOutboxRedeemer(outboxMessage));

  const scriptOutbox = new ScriptOutbox().compile(true);
  tx.attachScript(scriptOutbox);

  tx.addOutput(
    new helios.TxOutput(
      helios.Address.fromValidatorHash(scriptOutbox.validatorHash),
      new helios.Value(),
      helios.Datum.inline(
        serializeOutboxDatum(merkleTree, outboxMessage.message.toBuffer())
      )
    )
  );

  // console.log(1, JSON.stringify(tx.dump(), null, 2));

  await tx.finalize(new helios.NetworkParams(paramsPreview), baseAddress);

  tx.addSignatures(await relayerWallet.signTx(tx));
  const txId = await (blockfrost != null
    ? blockfrost.submitTx(tx)
    : relayerWallet.submitTx(tx));

  return new helios.UTxO(txId, 0n, tx.body.outputs[0]);
}
