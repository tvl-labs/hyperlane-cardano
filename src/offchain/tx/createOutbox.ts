import * as helios from "@hyperionbt/helios";
import {
  TOKEN_NAME_AUTH_BYTES,
  TOKEN_NAME_AUTH_HEX,
  getProgramKhalani,
  getProgramNFT,
  getProgramOutbox,
} from "../../onchain/programs";
import paramsPreprod from "../../../data/cardano-preprod-params.json";

import { type Wallet } from "../wallet";
import { blake2bHasher } from "../hasher";
import { HeliosMerkleTree } from "../merkle/helios.merkle";
import { serializeOutboxDatum } from "../outbox/outboxDatum";
import type { IsmParamsHelios } from "../inbox/ismParams";

export default async function createOutbox(
  wallet: Wallet,
  ismParamsHelios: IsmParamsHelios
): Promise<{
  utxoOutbox: helios.TxInput;
  utxoKhalani: helios.TxInput;
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

  const addressOutbox = helios.Address.fromHash(
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

  // Create an empty UTxO at Script Khalani to validate
  // a Khalani burn message. This should be optional, but
  // the fee is indead small.
  const addressKhalani = helios.Address.fromHash(
    getProgramKhalani(ismParamsHelios).validatorHash
  );
  tx.addOutput(
    new helios.TxOutput(
      addressKhalani,
      new helios.Value(),
      // We cannot make this inline (yet) per Khalani
      // minting policy's strict rule.
      helios.Datum.hashed(new helios.ConstrData(0, []))
    )
  );

  await tx.finalize(new helios.NetworkParams(paramsPreprod), wallet.address);

  tx.addSignatures(await wallet.signTx(tx));
  const txId = await wallet.submitTx(tx);

  return {
    utxoOutbox: new helios.TxInput(
      new helios.TxOutputId(txId, 0),
      tx.body.outputs[0]
    ),
    utxoKhalani: new helios.TxInput(
      new helios.TxOutputId(txId, 1),
      tx.body.outputs[1]
    ),
    outboxAuthToken,
  };
}
