import * as helios from "@hyperionbt/helios";
import paramsPreview from "../../../data/cardano-preview-params.json";
import MintingPolicyIsmMultiSig from "../../onchain/ismMultiSig.hl";
import { TOKEN_NAME_AUTH } from "../common";
import { AppParams } from "../../typing";

export default async function createMessage(
  appParams: AppParams,
  origin: helios.ByteArray,
  originMailbox: helios.ByteArray,
  checkpointRoot: helios.ByteArray,
  checkpointIndex: helios.ByteArray,
  message: helios.ByteArray,
  signatures: helios.ByteArray[],
  relayerWallet: helios.Wallet,
  blockfrost?: helios.BlockfrostV0
): Promise<helios.TxId> {
  const tx = new helios.Tx();

  let baseAddress = (await relayerWallet.usedAddresses)[0];
  if (!baseAddress) baseAddress = (await relayerWallet.unusedAddresses)[0];
  const utxos = await (blockfrost
    ? blockfrost.getUtxos(baseAddress)
    : relayerWallet.utxos);
  tx.addInputs(utxos);

  const ismMultiSig = new MintingPolicyIsmMultiSig(appParams).compile(true);
  tx.attachScript(ismMultiSig);
  tx.mintTokens(
    ismMultiSig.mintingPolicyHash,
    [[TOKEN_NAME_AUTH, BigInt(1)]],
    new helios.ListData([
      origin._toUplcData(),
      originMailbox._toUplcData(),
      checkpointRoot._toUplcData(),
      checkpointIndex._toUplcData(),
      message._toUplcData(),
      new helios.ListData(signatures.map((s) => s._toUplcData())),
    ])
  );

  tx.addOutput(
    new helios.TxOutput(
      appParams.ADDR_MESSAGE,
      new helios.Value(
        BigInt(0), // Let Helios calculate the min ADA!
        new helios.Assets([
          [ismMultiSig.mintingPolicyHash, [[TOKEN_NAME_AUTH, BigInt(1)]]],
        ])
      ),
      helios.Datum.inline(message)
    )
  );

  await tx.finalize(new helios.NetworkParams(paramsPreview), baseAddress);

  tx.addSignatures(await relayerWallet.signTx(tx));
  return blockfrost ? blockfrost.submitTx(tx) : relayerWallet.submitTx(tx);
}
