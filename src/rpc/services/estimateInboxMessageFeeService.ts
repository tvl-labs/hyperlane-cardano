import { type IEstimateInboxMessageFee } from "./IEstimateInboxMessageFeeService";
import {
  getIsmParamsHelios,
  estimateInboundMessageFee,
} from "../../offchain/inbox";
import type { Checkpoint } from "../../offchain/checkpoint";
import type { Wallet } from "../../offchain/wallet";

export class EstimateInboxMessageFeeService
  implements IEstimateInboxMessageFee
{
  async estimateInboundMessageFee(
    wallet: Wallet,
    checkpoint: Checkpoint,
    signatures: Uint8Array[]
  ): Promise<number> {
    const fee = await estimateInboundMessageFee(
      getIsmParamsHelios(),
      checkpoint,
      signatures,
      wallet
    );
    return Number(fee);
  }
}
