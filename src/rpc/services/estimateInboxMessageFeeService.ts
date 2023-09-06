import * as helios from "@hyperionbt/helios";
import { type IEstimateInboxMessageFee } from "./interfaces/IEstimateInboxMessageFeeService";
import {
  getIsmParamsHelios,
  estimateFeeInboundMessage,
  estimateFeeProcessInboundMessage,
} from "../../offchain/inbox";
import type { Checkpoint } from "../../offchain/checkpoint";
import { parseMessagePayloadMint } from "../../offchain/messagePayload";
import type { Wallet } from "../../offchain/wallet";
import { getInboxUTxO } from "../../offchain/indexer/getInboxUTxO";

export class EstimateInboxMessageFeeService
  implements IEstimateInboxMessageFee
{
  async estimateInboundMessageFee(
    wallet: Wallet,
    checkpoint: Checkpoint,
    signatures: Buffer[]
  ): Promise<number> {
    const ismParams = getIsmParamsHelios();
    const utxoInbox = await getInboxUTxO(ismParams);
    if (utxoInbox == null) {
      throw new Error("Inbox not found");
    }
    let { fee, outputMessage } = await estimateFeeInboundMessage(
      ismParams,
      utxoInbox,
      checkpoint,
      signatures,
      wallet
    );
    try {
      // NOTE: This is usually a gain, as the relayer gets back the huge
      // min ADA from the message UTxO while only paying a smaller min ADA
      // to the recipient. The annoying case is relayer A spending 4 ADA
      // to post the message for relayer B to make 1.5 ADA from processing.
      // It may be fairer for relayers to quote 4 ADA always?
      parseMessagePayloadMint(checkpoint.message.body);
      fee += await estimateFeeProcessInboundMessage(
        ismParams,
        new helios.UTxO(
          new helios.TxId(
            "0000000000000000000000000000000000000000000000000000000000000000"
          ),
          0,
          outputMessage
        ),
        wallet
      );
    } catch (e) {
      console.log("Not a mint payload", e);
    }
    return Number(fee);
  }
}
