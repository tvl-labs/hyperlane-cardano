import * as helios from "@hyperionbt/helios";
import paramsPreprod from "../../../data/cardano-preprod-params.json";
import MintingPolicyIsmMultiSig from "../../onchain/ismMultiSig.hl";
import { TOKEN_NAME_AUTH, getWalletInfo } from "../wallet";
import type { AppParams } from "../../typing";
import type { Message } from "../message";
import { serializeMessage } from "../messageSerialize";

export default async function createInboundMessage(
  appParams: AppParams,
  origin: helios.ByteArray,
  originMailbox: helios.ByteArray,
  checkpointRoot: helios.ByteArray,
  checkpointIndex: helios.ByteArray,
  message: Message,
  signatures: helios.ByteArray[],
  relayerWallet: helios.Wallet,
  blockfrost?: helios.BlockfrostV0
): Promise<helios.TxId> {
  const tx = new helios.Tx();

  const { baseAddress, utxos } = await getWalletInfo(relayerWallet, blockfrost);
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
      new helios.ListData(signatures.map((s) => s._toUplcData())),
    ])
  );

  tx.addOutput(
    new helios.TxOutput(
      appParams.ADDR_MESSAGE,
      new helios.Value(
        0n, // Let Helios calculate the min ADA!
        new helios.Assets([
          [ismMultiSig.mintingPolicyHash, [[TOKEN_NAME_AUTH, BigInt(1)]]],
        ])
      ),
      helios.Datum.inline(serializeMessage(message))
    )
  );

  await tx.finalize(new helios.NetworkParams(paramsPreprod), baseAddress);

  tx.addSignatures(await relayerWallet.signTx(tx));
  return await (blockfrost != null
    ? blockfrost.submitTx(tx)
    : relayerWallet.submitTx(tx));
}
