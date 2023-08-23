import * as helios from "@hyperionbt/helios";
import paramsPreprod from "../../../data/cardano-preprod-params.json";
import MintingPolicyIsmMultiSig from "../../onchain/ismMultiSig.hl";
import ScriptInbox from "../../onchain/scriptInbox.hl";
import { type Wallet } from "../wallet";
import type { IsmParamsHelios } from "../inbox/ismParams";
import { calculateMessageId, serializeMessage } from "../message";
import { serializeCheckpoint, type Checkpoint } from "../checkpoint";

async function buildInboundMessageTx(
  ismParams: IsmParamsHelios,
  utxoInbox: helios.UTxO,
  checkpoint: Checkpoint,
  signatures: Buffer[],
  wallet: Wallet
): Promise<helios.Tx> {
  const tx = new helios.Tx();

  const utxos = await wallet.getUtxos();
  tx.addInputs(utxos);
  tx.addInput(utxoInbox, new helios.ConstrData(0, []));
  const scriptInbox = new ScriptInbox().compile(true);
  tx.attachScript(scriptInbox);

  // Message hash
  const messageHash = calculateMessageId(checkpoint.message).toByteArray();
  const ismMultiSig = new MintingPolicyIsmMultiSig(ismParams).compile(true);
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
  tx.addOutput(
    new helios.TxOutput(
      // Support: Stake credentials
      new helios.Address(checkpoint.message.recipient.toHex().substr(-58)),
      new helios.Value(
        0n, // Let Helios calculate the min ADA!
        new helios.Assets([
          [ismMultiSig.mintingPolicyHash, [[messageHash, BigInt(1)]]],
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
  utxoInbox: helios.UTxO,
  checkpoint: Checkpoint,
  signatures: Buffer[],
  wallet: Wallet
): Promise<bigint> {
  const tx = await buildInboundMessageTx(
    ismParams,
    utxoInbox,
    checkpoint,
    signatures,
    wallet
  );
  return tx.body.fee;
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
  const tx = await buildInboundMessageTx(
    ismParams,
    utxoInbox,
    checkpoint,
    signatures,
    wallet
  );
  tx.addSignatures(await wallet.signTx(tx));
  const txId = await wallet.submitTx(tx);

  return {
    utxoMessage: new helios.UTxO(txId, BigInt(1), tx.body.outputs[1]),
    feeLovelace: Number(tx.body.fee),
  };
}
