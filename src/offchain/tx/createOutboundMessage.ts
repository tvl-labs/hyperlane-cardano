import * as helios from "@hyperionbt/helios";
import paramsPreview from "../../../data/cardano-preview-params.json";
import ScriptOutbox from "../../onchain/scriptOutbox.hl";
import { getWalletInfo } from "../common";

// TODO: Share code with on-chain?
function merkleTreeUpdateBranches(
  branches: helios.ByteArray[],
  i: number,
  size: number,
  node: helios.ByteArray
): helios.ByteArray[] {
  if (size % 2 === 1) {
    branches[i] = node;
    return branches;
  }
  return merkleTreeUpdateBranches(
    branches,
    i + 1,
    size / 2,
    new helios.ByteArray(
      helios.Crypto.blake2b(branches[i].bytes.concat(node.bytes))
    )
  );
}

export default async function createMessage(
  utxoOutbox: helios.UTxO,
  message: helios.ByteArray,
  relayerWallet: helios.Wallet,
  blockfrost?: helios.BlockfrostV0
): Promise<helios.TxId> {
  const currentDatum = JSON.parse(
    utxoOutbox.origOutput.datum.data.toSchemaJson()
  );
  const merkleTree = currentDatum.list[0].list;
  const branches = merkleTree[0].list.map((b) => new helios.ByteArray(b.bytes));
  const count = merkleTree[1].int;

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
          new helios.ListData([
            // Merkle tree
            new helios.ListData(
              merkleTreeUpdateBranches(branches, 0, count + 1, message).map(
                (ba) => ba._toUplcData()
              )
            ),
            // Count
            new helios.IntData(count + 1),
          ]),
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
