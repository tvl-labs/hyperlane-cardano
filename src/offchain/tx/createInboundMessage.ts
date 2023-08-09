import * as helios from "@hyperionbt/helios";
import paramsPreprod from "../../../data/cardano-preprod-params.json";
import MintingPolicyIsmMultiSig from "../../onchain/ismMultiSig.hl";
import ScriptInbox from "../../onchain/scriptInbox.hl";
import { TOKEN_NAME_AUTH, type Wallet } from "../wallet";
import type { IsmParamsHelios } from "../inbox/ismParams";
import { serializeMessage } from "../message";
import type { Checkpoint } from "../checkpoint";
import {
  bufferToHeliosByteArray,
  convertNumberToHeliosByteArray,
} from "../outbox/heliosByteArrayUtils";

console.log(
  helios.Address.fromValidatorHash(
    new ScriptInbox().compile(true).validatorHash
  )
);

async function buildInboundMessageTx(
  ismParams: IsmParamsHelios,
  checkpoint: Checkpoint,
  signatures: Buffer[],
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
      convertNumberToHeliosByteArray(checkpoint.origin, 4)._toUplcData(),
      bufferToHeliosByteArray(
        checkpoint.originMailbox.toBuffer()
      )._toUplcData(),
      bufferToHeliosByteArray(checkpoint.checkpointRoot)._toUplcData(),
      convertNumberToHeliosByteArray(
        checkpoint.checkpointIndex,
        4
      )._toUplcData(),
      new helios.ListData(
        signatures.map((s) =>
          new helios.ByteArray([...s.values()])._toUplcData()
        )
      ),
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
      helios.Datum.inline(serializeMessage(checkpoint.message))
    )
  );

  await tx.finalize(new helios.NetworkParams(paramsPreprod), wallet.address);

  return tx;
}

// Fee in lovelace.
// Note that fee is also dynamic and changes with
// the relayer's UTxO set.
export async function estimateInboundMessageFee(
  ismParams: IsmParamsHelios,
  checkpoint: Checkpoint,
  signatures: Buffer[],
  wallet: Wallet
): Promise<bigint> {
  const tx = await buildInboundMessageTx(
    ismParams,
    checkpoint,
    signatures,
    wallet
  );
  return tx.body.fee;
}

interface TxOutcome {
  txId: string;
  feeLovelace: number;
}

export async function createInboundMessage(
  ismParams: IsmParamsHelios,
  checkpoint: Checkpoint,
  signatures: Buffer[],
  wallet: Wallet
): Promise<TxOutcome> {
  const tx = await buildInboundMessageTx(
    ismParams,
    checkpoint,
    signatures,
    wallet
  );
  tx.addSignatures(await wallet.signTx(tx));
  const txId = await wallet.submitTx(tx);
  return { txId: txId.hex, feeLovelace: Number(tx.body.fee) };
}
