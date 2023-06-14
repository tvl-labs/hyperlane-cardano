import * as helios from "@hyperionbt/helios";
import ScriptOutbox from "../../onchain/scriptOutbox.hl";
import paramsPreview from "../../../data/cardano-preview-params.json";

import { getWalletInfo } from "../common";

export default async function createOutbox(
  relayerWallet: helios.Wallet,
  blockfrost?: helios.BlockfrostV0
): Promise<helios.TxId> {
  const tx = new helios.Tx();

  const { baseAddress, utxos } = await getWalletInfo(relayerWallet, blockfrost);
  tx.addInputs(utxos);

  const addressOutbox = helios.Address.fromValidatorHash(
    new ScriptOutbox().compile(true).validatorHash
  );
  tx.addOutput(
    new helios.TxOutput(
      addressOutbox,
      new helios.Value(),
      helios.Datum.inline(
        new helios.ListData([
          new helios.ListData([
            // Merkle tree
            new helios.ByteArray([])._toUplcData(),
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
  return blockfrost ? blockfrost.submitTx(tx) : relayerWallet.submitTx(tx);
}
