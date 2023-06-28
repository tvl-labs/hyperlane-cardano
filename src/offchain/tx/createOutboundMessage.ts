import * as helios from "@hyperionbt/helios";
import paramsPreview from "../../../data/cardano-preview-params.json";
import ScriptOutbox from "../../onchain/scriptOutbox.hl";
import { getWalletInfo } from "../common";
import { serializeMerkleTree } from '../outbox/outboxMerkle'
import { blake2bHasher } from '../../merkle/hasher'
import { deserializeOutboxDatum } from '../outbox/outboxDatum'

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

  const messageId = blake2bHasher(Buffer.concat([
    Buffer.from(version.bytes),
    Buffer.from(nonce.bytes),
    Buffer.from(originDomain.bytes),
    Buffer.from(sender.bytes),
    Buffer.from(destinationDomain.bytes),
    Buffer.from(recipient.bytes),
    Buffer.from(message.bytes),
  ]))

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
    new helios.ListData([
      version._toUplcData(),
      nonce._toUplcData(),
      originDomain._toUplcData(),
      sender._toUplcData(),
      destinationDomain._toUplcData(),
      recipient._toUplcData(),
    ])
  );

  const scriptOutbox = new ScriptOutbox().compile(true);
  tx.attachScript(scriptOutbox);

  tx.addOutput(
    new helios.TxOutput(
      helios.Address.fromValidatorHash(scriptOutbox.validatorHash),
      new helios.Value(),
      helios.Datum.inline(
        new helios.ListData([
          // Merkle tree
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
