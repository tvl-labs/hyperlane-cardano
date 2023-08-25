import * as helios from "@hyperionbt/helios";
import {
  TOKEN_NAME_AUTH_BYTES,
  TOKEN_NAME_AUTH_HEX,
  getProgramNFT,
  getProgramOutbox,
} from "../../onchain/programs";
import paramsPreprod from "../../../data/cardano-preprod-params.json";

import { type Wallet } from "../wallet";
import { blake2bHasher } from "../../merkle/hasher";
import { HeliosMerkleTree } from "../../merkle/helios.merkle";
import { serializeOutboxDatum } from "../outbox/outboxDatum";

export default async function createOutbox(wallet: Wallet): Promise<{
  utxo: helios.UTxO;
  outboxAuthToken: string;
}> {
  const tx = new helios.Tx();

  const utxos = await wallet.getUtxos();
  tx.addInputs(utxos);

  const mpNFT = getProgramNFT(
    new helios.TxOutputId([utxos[0].txId, utxos[0].utxoIdx])
  );
  tx.attachScript(mpNFT);

  const tokens: [number[], bigint][] = [[TOKEN_NAME_AUTH_BYTES, BigInt(1)]];
  tx.mintTokens(mpNFT.mintingPolicyHash, tokens, new helios.ConstrData(0, []));

  // TODO: add a class for "auth" token, can CardanoTokenName be reused?
  const outboxAuthToken = mpNFT.mintingPolicyHash.hex + TOKEN_NAME_AUTH_HEX;

  const addressOutbox = helios.Address.fromValidatorHash(
    getProgramOutbox().validatorHash
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

  const utxo = new helios.UTxO(txId, 0n, tx.body.outputs[0]);
  return {
    utxo,
    outboxAuthToken,
  };
}
