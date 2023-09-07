import * as helios from "@hyperionbt/helios";
import { getProgramLockForever } from "../../onchain/programs";
import paramsPreprod from "../../../data/cardano-preprod-params.json";

import { type Wallet } from "../wallet";
import {
  type ValidatorStorageLocation,
  serializeValidatorStorageLocation,
} from "../validatorStorageLocation";

export default async function announceValidatorStorageLocation(
  wallet: Wallet,
  location: ValidatorStorageLocation
): Promise<helios.TxId> {
  const tx = new helios.Tx();

  const utxos = await wallet.getUtxos();
  tx.addInputs(utxos);

  const addressLockForever = helios.Address.fromHash(
    getProgramLockForever().validatorHash
  );

  tx.addOutput(
    new helios.TxOutput(
      addressLockForever,
      new helios.Value(),
      helios.Datum.inline(serializeValidatorStorageLocation(location))
    )
  );

  await tx.finalize(new helios.NetworkParams(paramsPreprod), wallet.address);

  tx.addSignatures(await wallet.signTx(tx));
  return await wallet.submitTx(tx);
}
