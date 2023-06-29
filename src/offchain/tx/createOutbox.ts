import * as helios from "@hyperionbt/helios";
import ScriptOutbox from "../../onchain/scriptOutbox.hl";
import paramsPreview from "../../../data/cardano-preview-params.json";

import { getWalletInfo } from "../wallet";
import { blake2bHasher } from '../../merkle/hasher'
import { HeliosMerkleTree } from '../../merkle/helios.merkle'
import { serializeOutboxDatum } from '../outbox/outboxDatum'

export default async function createOutbox(
  relayerWallet: helios.Wallet,
  blockfrost?: helios.BlockfrostV0
): Promise<helios.UTxO> {
  const tx = new helios.Tx();

  const { baseAddress, utxos } = await getWalletInfo(relayerWallet, blockfrost);
  tx.addInputs(utxos);

  const addressOutbox = helios.Address.fromValidatorHash(
    new ScriptOutbox().compile(true).validatorHash
  );

  const merkleTree = new HeliosMerkleTree(blake2bHasher);

  tx.addOutput(
    new helios.TxOutput(
      addressOutbox,
      new helios.Value(),
      helios.Datum.inline(
        serializeOutboxDatum(merkleTree, Buffer.alloc(0))
      )
    )
  );

  await tx.finalize(new helios.NetworkParams(paramsPreview), baseAddress);

  tx.addSignatures(await relayerWallet.signTx(tx));
  const txId = await (blockfrost
    ? blockfrost.submitTx(tx)
    : relayerWallet.submitTx(tx));

  return new helios.UTxO(txId, 0n, tx.body.outputs[0]);
}
