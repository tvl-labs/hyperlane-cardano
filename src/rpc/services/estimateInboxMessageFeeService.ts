import * as helios from "@hyperionbt/helios";
import { type IEstimateInboxMessageFee } from "./IEstimateInboxMessageFeeService";
import {
  getIsmParamsHelios,
  estimateInboundMessageFee,
} from "../../offchain/inbox";
import type { Checkpoint } from "../../offchain/checkpoint";
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
    const ismParams = getIsmParamsHelios(
      new helios.TxOutputId(process.env.ISM_OUTPUT_ID ?? "")
    );
    const fee = await estimateInboundMessageFee(
      ismParams,
      await getInboxUTxO(ismParams),
      checkpoint,
      signatures,
      wallet
    );
    return Number(fee);
  }
}
