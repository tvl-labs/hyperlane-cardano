import * as helios from "@hyperionbt/helios";
import ScriptOutbox from "../../onchain/scriptOutbox.hl";
import paramsPreview from "../../../data/cardano-preview-params.json";

import { getWalletInfo } from "../common";

const TREE_DEPTH = 32;

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

  // TODO: Dynamic size?
  const branches = [];
  for (let i = 0; i < TREE_DEPTH; i++) {
    branches.push(new helios.ByteArray([])._toUplcData());
  }

  tx.addOutput(
    new helios.TxOutput(
      addressOutbox,
      new helios.Value(),
      helios.Datum.inline(
        new helios.ListData([
          // Merkle tree
          new helios.ListData([
            // Branches
            new helios.ListData(branches),
            // Count
            new helios.IntData(0n),
          ]),
          // Latest message
          new helios.ByteArray([])._toUplcData(),
        ])
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
