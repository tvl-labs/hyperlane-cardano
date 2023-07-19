import * as helios from "@hyperionbt/helios";
import paramsPreprod from "../../../data/cardano-preprod-params.json";
import MintingPolicyIsmMultiSig from "../../onchain/ismMultiSig.hl";
import { TOKEN_NAME_AUTH, type Wallet } from "../wallet";
import type { IsmParamsHelios } from "../inbox/ismParams";
import type { Message } from "../message";
import { serializeMessage } from "../messageSerialize";

// TODO: Expose API to "share" the tx between functions.

async function buildInboundMessageTx(
  ismParams: IsmParamsHelios,
  origin: helios.ByteArray,
  originMailbox: helios.ByteArray,
  checkpointRoot: helios.ByteArray,
  checkpointIndex: helios.ByteArray,
  message: Message,
  signatures: helios.ByteArray[],
  wallet: Wallet
): Promise<helios.Tx> {
  const tx = new helios.Tx();

  const utxos = await wallet.getUtxos();
  tx.addInputs(utxos);

  const ismMultiSig = new MintingPolicyIsmMultiSig(ismParams).compile(true);
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
      ismParams.RECIPIENT_ADDRESS,
      new helios.Value(
        0n, // Let Helios calculate the min ADA!
        new helios.Assets([
          [ismMultiSig.mintingPolicyHash, [[TOKEN_NAME_AUTH, BigInt(1)]]],
        ])
      ),
      helios.Datum.inline(serializeMessage(message))
    )
  );

  await tx.finalize(new helios.NetworkParams(paramsPreprod), wallet.address);

  tx.addSignatures(await wallet.signTx(tx));
  return tx;
}

// Fee in lovelace.
// Note that fee is also dynamic and changes with
// the relayer's UTxO set.
export async function estimateInboundMessageFee(
  ismParams: IsmParamsHelios,
  origin: helios.ByteArray,
  originMailbox: helios.ByteArray,
  checkpointRoot: helios.ByteArray,
  checkpointIndex: helios.ByteArray,
  message: Message,
  signatures: helios.ByteArray[],
  wallet: Wallet
): Promise<bigint> {
  const tx = await buildInboundMessageTx(
    ismParams,
    origin,
    originMailbox,
    checkpointRoot,
    checkpointIndex,
    message,
    signatures,
    wallet
  );
  return tx.body.fee;
}

export async function createInboundMessage(
  ismParams: IsmParamsHelios,
  origin: helios.ByteArray,
  originMailbox: helios.ByteArray,
  checkpointRoot: helios.ByteArray,
  checkpointIndex: helios.ByteArray,
  message: Message,
  signatures: helios.ByteArray[],
  wallet: Wallet
): Promise<helios.TxId> {
  const tx = await buildInboundMessageTx(
    ismParams,
    origin,
    originMailbox,
    checkpointRoot,
    checkpointIndex,
    message,
    signatures,
    wallet
  );
  return await wallet.submitTx(tx);
}
