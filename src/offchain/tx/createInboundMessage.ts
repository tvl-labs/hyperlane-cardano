import * as helios from "@hyperionbt/helios";
import paramsPreprod from "../../../data/cardano-preprod-params.json";
import { getProgramIsmKhalani, getProgramInbox } from "../../onchain/programs";
import { type Wallet } from "../wallet";
import type { IsmParamsHelios } from "../inbox/ismParams";
import { calculateMessageId, serializeMessage } from "../message";
import { serializeCheckpoint, type Checkpoint } from "../checkpoint";

interface BuiltTxInboundMessage {
  tx: helios.Tx;
  outputMessage: helios.TxOutput;
}

async function buildTxInboundMessage(
  ismParams: IsmParamsHelios,
  utxoInbox: helios.UTxO,
  checkpoint: Checkpoint,
  signatures: Buffer[],
  wallet: Wallet
): Promise<BuiltTxInboundMessage> {
  const tx = new helios.Tx();

  const utxos = await wallet.getUtxos();
  tx.addInputs(utxos);
  tx.addInput(utxoInbox, new helios.ConstrData(0, []));
  const scriptInbox = getProgramInbox();
  tx.attachScript(scriptInbox);

  // Message hash
  const messageHash = calculateMessageId(checkpoint.message).toByteArray();
  const ismMultiSig = getProgramIsmKhalani(ismParams);
  tx.attachScript(ismMultiSig);
  tx.mintTokens(
    ismMultiSig.mintingPolicyHash,
    [[messageHash, BigInt(1)]],
    new helios.ConstrData(1, serializeCheckpoint(checkpoint, signatures))
  );

  // Inbox
  tx.addOutput(
    new helios.TxOutput(
      utxoInbox.origOutput.address,
      new helios.Value(0n, utxoInbox.origOutput.value.assets),
      helios.Datum.inline(
        new helios.ListData([
          new helios.ByteArray(messageHash)._toUplcData(),
          ...utxoInbox.origOutput.datum.data.list,
        ])
      )
    )
  );

  // Recipient
  const outputMessage = new helios.TxOutput(
    // Support: Stake credentials
    checkpoint.message.recipient.toCardanoAddress(),
    new helios.Value(
      0n, // Let Helios calculate the min ADA!
      new helios.Assets([
        [ismMultiSig.mintingPolicyHash, [[messageHash, BigInt(1)]]],
      ])
    ),
    helios.Datum.inline(serializeMessage(checkpoint.message))
  );
  tx.addOutput(outputMessage);

  await tx.finalize(new helios.NetworkParams(paramsPreprod), wallet.address);

  return { tx, outputMessage };
}

interface EstimatedFeeInboundMessage {
  fee: bigint;
  outputMessage: helios.TxOutput;
}

// Fee in lovelace.
// Note that fee is also dynamic and changes with
// the relayer's UTxO set.
export async function estimateFeeInboundMessage(
  ismParams: IsmParamsHelios,
  utxoInbox: helios.UTxO,
  checkpoint: Checkpoint,
  signatures: Buffer[],
  wallet: Wallet
): Promise<EstimatedFeeInboundMessage> {
  const { tx, outputMessage } = await buildTxInboundMessage(
    ismParams,
    utxoInbox,
    checkpoint,
    signatures,
    wallet
  );
  const inputLovelace = tx.body.inputs.reduce((sum, input) => {
    if (input.address === wallet.address) {
      return sum + input.value.lovelace;
    }
    return sum;
  }, 0n);
  const outputLovelace = tx.body.outputs.reduce((sum, output) => {
    if (output.address === wallet.address) {
      return sum + output.value.lovelace;
    }
    return sum;
  }, 0n);
  return { fee: inputLovelace - outputLovelace, outputMessage };
}

interface TxOutcome {
  utxoMessage: helios.UTxO;
  feeLovelace: number;
}

export async function createInboundMessage(
  ismParams: IsmParamsHelios,
  utxoInbox: helios.UTxO,
  checkpoint: Checkpoint,
  signatures: Buffer[],
  wallet: Wallet
): Promise<TxOutcome> {
  const { tx, outputMessage } = await buildTxInboundMessage(
    ismParams,
    utxoInbox,
    checkpoint,
    signatures,
    wallet
  );
  tx.addSignatures(await wallet.signTx(tx));
  const txId = await wallet.submitTx(tx);

  return {
    utxoMessage: new helios.UTxO(txId, BigInt(1), outputMessage),
    feeLovelace: Number(tx.body.fee),
  };
}
