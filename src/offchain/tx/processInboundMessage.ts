import * as helios from "@hyperionbt/helios";
import paramsPreprod from "../../../data/cardano-preprod-params.json";
import MintingPolicyIsmMultiSig from "../../onchain/ismMultiSig.hl";
import ScriptKhalani from "../../onchain/scriptKhalani.hl";
import { type Wallet } from "../wallet";
import type { IsmParamsHelios } from "../inbox/ismParams";

export async function processInboundMessage(
  ismParams: IsmParamsHelios,
  utxoMessage: helios.UTxO,
  wallet: Wallet
): Promise<helios.TxId> {
  const tx = new helios.Tx();

  const utxos = await wallet.getUtxos();
  tx.addInputs(utxos);
  tx.addInput(utxoMessage, new helios.ConstrData(0, []));
  const scriptKhalani = new ScriptKhalani().compile(true);
  tx.attachScript(scriptKhalani);

  // Burn the ISM token
  const ismMultiSig = new MintingPolicyIsmMultiSig(ismParams).compile(true);
  tx.attachScript(ismMultiSig);
  tx.mintTokens(
    ismMultiSig.mintingPolicyHash,
    [
      [
        utxoMessage.value.assets.getTokens(ismMultiSig.mintingPolicyHash)[0][0]
          .bytes,
        BigInt(-1),
      ],
    ],
    new helios.ConstrData(2, [])
  );

  // TODO: Specific processing depending on the message

  await tx.finalize(new helios.NetworkParams(paramsPreprod), wallet.address);

  tx.addSignatures(await wallet.signTx(tx));

  return await wallet.submitTx(tx);
}
