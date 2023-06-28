import * as helios from "@hyperionbt/helios";
import paramsPreview from "../../../data/cardano-preview-params.json";
import ScriptOutbox from "../../onchain/scriptOutbox.hl";
import { getWalletInfo } from "../common";
import { deserializeOutboxDatum, serializeOutboxDatum } from '../outbox/outboxDatum'
import { calculateMessageId, serializeOutboxRedeemer } from '../outbox/outboxMessage'

// TODO: More specific types here?
export default async function createMessage(
  utxoOutbox: helios.UTxO,
  version: helios.ByteArray,
  nonce: helios.ByteArray,
  originDomain: helios.ByteArray,
  sender: helios.ByteArray,
  destinationDomain: helios.ByteArray,
  recipient: helios.ByteArray,
  message: helios.ByteArray,
  relayerWallet: helios.Wallet,
  blockfrost?: helios.BlockfrostV0
): Promise<helios.TxId> {
  const { merkleTree } = deserializeOutboxDatum(utxoOutbox);

  const messageId = calculateMessageId(version, nonce, originDomain, sender, destinationDomain, recipient, message)
  merkleTree.ingest(messageId);

  const tx = new helios.Tx();

  const { baseAddress, utxos } = await getWalletInfo(relayerWallet, blockfrost);
  tx.addInputs(utxos);
  for (let i = 0; i < 3 && i < utxos.length; i++) {
    if (!utxos[i].value.assets.isZero()) continue;
    tx.addCollateral(utxos[i]);
  }

  tx.addInput(
    utxoOutbox,
    serializeOutboxRedeemer(version, nonce, originDomain, sender, destinationDomain, recipient)
  );

  const scriptOutbox = new ScriptOutbox().compile(true);
  tx.attachScript(scriptOutbox);

  tx.addOutput(
    new helios.TxOutput(
      helios.Address.fromValidatorHash(scriptOutbox.validatorHash),
      new helios.Value(),
      helios.Datum.inline(
        serializeOutboxDatum(merkleTree, message)
      )
    )
  );

  await tx.finalize(new helios.NetworkParams(paramsPreview), baseAddress);

  tx.addSignatures(await relayerWallet.signTx(tx));
  return blockfrost ? blockfrost.submitTx(tx) : relayerWallet.submitTx(tx);
}
