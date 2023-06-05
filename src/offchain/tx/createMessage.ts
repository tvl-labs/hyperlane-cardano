import * as helios from "@hyperionbt/helios";
import paramsPreview from "../../../data/cardano-preview-params.json";
import MintingPolicyIsmMultiSig from "../../onchain/ismMultiSig.hl";

export default async function createMessage(
  PK_OWNERS: helios.PubKey[],
  NUM_SIGNATURES_REQUIRED: bigint,
  ADDR_MESSAGE: helios.Address,
  message: helios.UplcData,
  signatures: helios.ListData,
  relayerWallet: helios.Wallet
) {
  const tx = new helios.Tx();
  const utxos = await relayerWallet.utxos;
  tx.addInputs(utxos);

  const ismMultiSig = new MintingPolicyIsmMultiSig({
    PK_OWNERS,
    NUM_SIGNATURES_REQUIRED,
    ADDR_MESSAGE,
  }).compile(true);

  tx.attachScript(ismMultiSig);
  tx.mintTokens(
    ismMultiSig.mintingPolicyHash,
    [[helios.textToBytes("auth"), BigInt(1)]],
    new helios.ListData([message, signatures])
  );

  tx.addOutput(
    new helios.TxOutput(
      ADDR_MESSAGE,
      new helios.Value(
        BigInt(0), // Let Helios calculate the min ADA!
        new helios.Assets([
          [
            ismMultiSig.mintingPolicyHash,
            [[helios.textToBytes("auth"), BigInt(1)]],
          ],
        ])
      ),
      helios.Datum.inline(message)
    )
  );

  await tx.finalize(
    new helios.NetworkParams(paramsPreview),
    utxos[0].origOutput.address
  );

  tx.addSignatures(await relayerWallet.signTx(tx));
  const txId = await relayerWallet.submitTx(tx);
  console.log(txId.hex);
}
