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
    const ismParams = getIsmParamsHelios();
    const utxoInbox = await getInboxUTxO(ismParams);
    if (utxoInbox == null) {
      throw new Error("Inbox not found");
    }
    const fee = await estimateInboundMessageFee(
      ismParams,
      utxoInbox,
      checkpoint,
      signatures,
      wallet
    );
    return Number(fee);
  }
}
