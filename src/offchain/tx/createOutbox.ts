import * as helios from "@hyperionbt/helios";
import { getProgramOutbox } from "../../onchain/programs";
import MintingPolicyNFT from "../../onchain/mpNFT.hl";
import paramsPreprod from "../../../data/cardano-preprod-params.json";

import { type Wallet } from "../wallet";
import { blake2bHasher } from "../../merkle/hasher";
import { HeliosMerkleTree } from "../../merkle/helios.merkle";
import { serializeOutboxDatum } from "../outbox/outboxDatum";
import type { IsmParamsHelios } from "../inbox/ismParams";

export default async function createOutbox(
  wallet: Wallet,
  ismParams?: IsmParamsHelios
): Promise<helios.UTxO> {
  const tx = new helios.Tx();

  const utxos = await wallet.getUtxos();
  tx.addInputs(utxos);

  const mpNFT = new MintingPolicyNFT({
    OUTPUT_ID: new helios.TxOutputId([utxos[0].txId, utxos[0].utxoIdx]),
  }).compile(true);
  tx.attachScript(mpNFT);

  const tokens: [number[], bigint][] = [
    [helios.textToBytes("auth"), BigInt(1)],
  ];
  tx.mintTokens(mpNFT.mintingPolicyHash, tokens, new helios.ConstrData(0, []));

  const addressOutbox = helios.Address.fromValidatorHash(
    getProgramOutbox(ismParams).validatorHash
  );
  const merkleTree = new HeliosMerkleTree(blake2bHasher);

  tx.addOutput(
    new helios.TxOutput(
      addressOutbox,
      new helios.Value(
        BigInt(0),
        new helios.Assets([[mpNFT.mintingPolicyHash, tokens]])
      ),
      helios.Datum.inline(serializeOutboxDatum(merkleTree))
    )
  );

  await tx.finalize(new helios.NetworkParams(paramsPreprod), wallet.address);

  tx.addSignatures(await wallet.signTx(tx));
  const txId = await wallet.submitTx(tx);

  return new helios.UTxO(txId, 0n, tx.body.outputs[0]);
}
