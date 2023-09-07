import * as helios from "@hyperionbt/helios";
import { getIsmParamsHelios, type IsmParamsHelios } from "../inbox/ismParams";
import {
  TOKEN_NAME_AUTH_BYTES,
  getProgramIsmKhalani,
  getProgramInbox,
} from "../../onchain/programs";
import paramsPreprod from "../../../data/cardano-preprod-params.json";

import { type Wallet } from "../wallet";

interface Inbox {
  ismParams: IsmParamsHelios;
  utxoInbox: helios.TxInput;
  inboxOutputId: helios.TxOutputId;
}

export default async function createInbox(wallet: Wallet): Promise<Inbox> {
  const tx = new helios.Tx();

  const utxos = await wallet.getUtxos();
  tx.addInputs(utxos);

  const outputId = utxos[0].outputId;
  console.log(`Inbox output id: ${outputId.txId.hex}#${outputId.utxoIdx}`);
  const ismParams = getIsmParamsHelios(outputId);

  const mpISM = getProgramIsmKhalani(ismParams);
  tx.attachScript(mpISM);

  const authToken: [number[], bigint][] = [[TOKEN_NAME_AUTH_BYTES, BigInt(1)]];
  tx.mintTokens(
    mpISM.mintingPolicyHash,
    authToken,
    new helios.ConstrData(0, [])
  );

  tx.addOutput(
    new helios.TxOutput(
      helios.Address.fromHash(getProgramInbox().validatorHash),
      new helios.Value(
        BigInt(0),
        new helios.Assets([[mpISM.mintingPolicyHash, authToken]])
      ),
      helios.Datum.inline(new helios.ListData([]))
    )
  );

  await tx.finalize(new helios.NetworkParams(paramsPreprod), wallet.address);

  tx.addSignatures(await wallet.signTx(tx));
  const txId = await wallet.submitTx(tx);

  return {
    ismParams,
    utxoInbox: new helios.TxInput(
      new helios.TxOutputId(txId, 0n),
      tx.body.outputs[0]
    ),
    inboxOutputId: outputId,
  };
}
