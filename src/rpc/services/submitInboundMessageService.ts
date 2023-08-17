import { type ISubmitInboundMessage } from "./ISubmitInboundMessageService";
import type { SubmitInboundMessageResponseBody } from "../types";
import { getIsmParamsHelios, createInboundMessage } from "../../offchain/inbox";
import type { Checkpoint } from "../../offchain/checkpoint";
import type { Wallet } from "../../offchain/wallet";
import { getInboxUTxO } from "../../offchain/indexer/getInboxUTxO";

export class SubmitInboundMessageService implements ISubmitInboundMessage {
  async submitInboundMessage(
    wallet: Wallet,
    checkpoint: Checkpoint,
    signatures: Buffer[]
  ): Promise<SubmitInboundMessageResponseBody> {
    const ismParams = getIsmParamsHelios();
    const utxoInbox = await getInboxUTxO(ismParams);
    if (utxoInbox == null) {
      throw new Error("Inbox not found");
    }
    const txOutcome = await createInboundMessage(
      ismParams,
      utxoInbox,
      checkpoint,
      signatures,
      wallet
    );
    return {
      txId: txOutcome.utxoMessage.txId.hex,
      feeLovelace: txOutcome.feeLovelace,
    };
  }
}
