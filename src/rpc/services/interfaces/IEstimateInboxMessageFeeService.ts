import type { Checkpoint } from "../../../offchain/checkpoint";
import type { Wallet } from "../../../offchain/wallet";

export interface IEstimateInboxMessageFee {
  estimateInboundMessageFee: (
    wallet: Wallet,
    checkpoint: Checkpoint,
    signatures: Buffer[]
  ) => Promise<number>;
}
