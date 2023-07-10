import * as helios from "@hyperionbt/helios";
import paramsPreprod from "../../../data/cardano-preprod-params.json";
import ScriptOutbox from "../../onchain/scriptOutbox.hl";
import { getWalletInfo } from "../wallet";
import {
  deserializeOutboxDatum,
  serializeOutboxDatum,
} from "../outbox/outboxDatum";
import { calculateMessageId, type Message } from "../message";
import { serializeOutboxRedeemer } from "../messageSerialize";

export default async function createOutboundMessage(
  utxoOutbox: helios.UTxO,
  outboxMessage: Message,
  relayerWallet: helios.Wallet,
  blockfrost?: helios.BlockfrostV0
): Promise<helios.UTxO> {
  const { merkleTree } = deserializeOutboxDatum(utxoOutbox);

  const messageId = calculateMessageId(outboxMessage);
  merkleTree.ingest(messageId);

  const tx = new helios.Tx();

  const { baseAddress, utxos } = await getWalletInfo(relayerWallet, blockfrost);
  tx.addInputs(utxos);
  for (let i = 0; i < utxos.length && tx.body.collateral.length < 3; i++) {
    if (!utxos[i].value.assets.isZero()) continue;
    tx.addCollateral(utxos[i]);
  }

  tx.addInput(utxoOutbox, serializeOutboxRedeemer(outboxMessage));

  const scriptOutbox = new ScriptOutbox().compile(true);
  tx.attachScript(scriptOutbox);

  const outputOutbox = new helios.TxOutput(
    helios.Address.fromValidatorHash(scriptOutbox.validatorHash),
    helios.Value.fromCbor(utxoOutbox.origOutput.value.toCbor()),
    helios.Datum.inline(
      serializeOutboxDatum(merkleTree, outboxMessage.message.toBuffer())
    )
  );
  tx.addOutput(outputOutbox);

  await tx.finalize(new helios.NetworkParams(paramsPreprod), baseAddress);

  tx.addSignatures(await relayerWallet.signTx(tx));

  const txId = await (blockfrost != null
    ? blockfrost.submitTx(tx)
    : relayerWallet.submitTx(tx));

  return new helios.UTxO(txId, 0n, outputOutbox);
}
