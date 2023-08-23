import * as helios from "@hyperionbt/helios";
import { getIsmParamsHelios, type IsmParamsHelios } from "../inbox/ismParams";
import MintingPolicyIsmMultiSig from "../../onchain/ismMultiSig.hl";
import ScriptInbox from "../../onchain/scriptInbox.hl";
import paramsPreprod from "../../../data/cardano-preprod-params.json";

import { type Wallet } from "../wallet";

interface Inbox {
  ismParams: IsmParamsHelios;
  utxoInbox: helios.UTxO;
  inboxOutputId: helios.TxOutputId;
}

export default async function createInbox(wallet: Wallet): Promise<Inbox> {
  const tx = new helios.Tx();

  const utxos = await wallet.getUtxos();
  tx.addInputs(utxos);

  const outputId = new helios.TxOutputId([utxos[0].txId, utxos[0].utxoIdx]);
  console.log(`Inbox output id: ${outputId.txId.hex}#${outputId.utxoIdx}`);
  const ismParams = getIsmParamsHelios(outputId);

  const mpISM = new MintingPolicyIsmMultiSig(ismParams).compile(true);
  tx.attachScript(mpISM);

  const authToken: [number[], bigint][] = [
    [helios.textToBytes("auth"), BigInt(1)],
  ];
  tx.mintTokens(
    mpISM.mintingPolicyHash,
    authToken,
    new helios.ConstrData(0, [])
  );

  tx.addOutput(
    new helios.TxOutput(
      helios.Address.fromValidatorHash(
        new ScriptInbox().compile(true).validatorHash
      ),
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
    utxoInbox: new helios.UTxO(txId, 0n, tx.body.outputs[0]),
    inboxOutputId: outputId
  };
}
