import * as helios from "@hyperionbt/helios";
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
    const ismParams = getIsmParamsHelios(
      new helios.TxOutputId(process.env.ISM_OUTPUT_ID ?? "")
    );
    const utxoInbox = await getInboxUTxO(ismParams);
    if (utxoInbox == null) {
      throw new Error("Inbox not found");
    }
    return await createInboundMessage(
      ismParams,
      utxoInbox,
      checkpoint,
      signatures,
      wallet
    );
  }
}
