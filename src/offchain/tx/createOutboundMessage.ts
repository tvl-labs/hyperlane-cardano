import * as helios from "@hyperionbt/helios";
import paramsPreview from "../../../data/cardano-preview-params.json";
import ScriptOutbox from "../../onchain/scriptOutbox.hl";
import { getWalletInfo } from "../common";
import { HeliosMerkleTree } from '../../merkle/helios.merkle';
import { blake2bHasher } from '../../merkle/hasher';
import { deserializeMerkleTree, serializeMerkleTree } from '../outbox/outboxMerkle';

function parseOutboxDatum(utxoOutbox: helios.UTxO): { merkleTree: HeliosMerkleTree } {
  const datumOutbox = utxoOutbox.origOutput.datum.data;
  const datumMerkleTree = datumOutbox.list[0];
  const merkleTree = deserializeMerkleTree(datumMerkleTree);
  return { merkleTree };
}

export default async function createMessage(
  utxoOutbox: helios.UTxO,
  message: helios.ByteArray,
  relayerWallet: helios.Wallet,
  blockfrost?: helios.BlockfrostV0
): Promise<helios.TxId> {
  const { merkleTree } = parseOutboxDatum(utxoOutbox);

  // TODO: calculate message ID according to the Hyperlane spec.
  const messageId = blake2bHasher(Buffer.from(message.bytes));
  merkleTree.ingest(messageId);

  const tx = new helios.Tx();

  const { baseAddress, utxos } = await getWalletInfo(relayerWallet, blockfrost);
  tx.addInputs(utxos);
  for (let i = 0; i < 3 && i < utxos.length; i++) {
    if (!utxos[i].value.assets.isZero()) continue;
    tx.addCollateral(utxos[i]);
  }

  tx.addInput(utxoOutbox, new helios.ConstrData(0, []));

  const scriptOutbox = new ScriptOutbox().compile(true);
  tx.attachScript(scriptOutbox);

  tx.addOutput(
    new helios.TxOutput(
      helios.Address.fromValidatorHash(scriptOutbox.validatorHash),
      new helios.Value(),
      helios.Datum.inline(
        new helios.ListData([
          serializeMerkleTree(merkleTree),
          // Latest message
          message._toUplcData(),
        ])
      )
    )
  );

  await tx.finalize(new helios.NetworkParams(paramsPreview), baseAddress);

  tx.addSignatures(await relayerWallet.signTx(tx));
  return blockfrost ? blockfrost.submitTx(tx) : relayerWallet.submitTx(tx);
}
