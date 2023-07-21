import * as helios from "@hyperionbt/helios";
import paramsPreprod from "../../../data/cardano-preprod-params.json";
import { type Wallet } from "../wallet";

export default async function payOutbounRelayer(
  wallet: Wallet,
  relayerAddress: helios.Address,
  feeLovelace: bigint,
  messageId: helios.ByteArray
): Promise<helios.TxId> {
  const tx = new helios.Tx();

  const utxos = await wallet.getUtxos();
  tx.addInputs(utxos);

  tx.addOutput(
    new helios.TxOutput(
      relayerAddress,
      new helios.Value(BigInt(feeLovelace)),
      helios.Datum.inline(messageId._toUplcData())
    )
  );

  await tx.finalize(new helios.NetworkParams(paramsPreprod), wallet.address);

  tx.addSignatures(await wallet.signTx(tx));
  return await wallet.submitTx(tx);
}
