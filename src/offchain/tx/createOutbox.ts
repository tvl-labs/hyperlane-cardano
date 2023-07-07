import * as helios from "@hyperionbt/helios";
import MintingPolicyMaster from "../../onchain/mpMaster.hl";
import ScriptOutbox from "../../onchain/scriptOutbox.hl";
import paramsPreprod from "../../../data/cardano-preprod-params.json";

import { getWalletInfo } from "../wallet";
import { blake2bHasher } from "../../merkle/hasher";
import { HeliosMerkleTree } from "../../merkle/helios.merkle";
import { serializeOutboxDatum } from "../outbox/outboxDatum";

export default async function createOutbox(
  relayerWallet: helios.Wallet,
  blockfrost?: helios.BlockfrostV0
): Promise<helios.UTxO> {
  const tx = new helios.Tx();

  const { baseAddress, utxos } = await getWalletInfo(relayerWallet, blockfrost);
  tx.addInputs(utxos);

  const mpMaster = new MintingPolicyMaster({
    MASTER_PKH: baseAddress.pubKeyHash,
  }).compile(true);
  tx.attachScript(mpMaster);
  tx.addSigner(baseAddress.pubKeyHash);

  const tokens: [number[], bigint][] = [
    [helios.textToBytes("auth"), BigInt(1)],
  ];
  tx.mintTokens(
    mpMaster.mintingPolicyHash,
    tokens,
    new helios.ConstrData(0, [])
  );

  const addressOutbox = helios.Address.fromValidatorHash(
    new ScriptOutbox().compile(true).validatorHash
  );
  const merkleTree = new HeliosMerkleTree(blake2bHasher);

  tx.addOutput(
    new helios.TxOutput(
      addressOutbox,
      new helios.Value(
        BigInt(0),
        new helios.Assets([[mpMaster.mintingPolicyHash, tokens]])
      ),
      helios.Datum.inline(serializeOutboxDatum(merkleTree, Buffer.alloc(0)))
    )
  );

  await tx.finalize(new helios.NetworkParams(paramsPreprod), baseAddress);

  tx.addSignatures(await relayerWallet.signTx(tx));
  const txId = await (blockfrost != null
    ? blockfrost.submitTx(tx)
    : relayerWallet.submitTx(tx));

  return new helios.UTxO(txId, 0n, tx.body.outputs[0]);
}
