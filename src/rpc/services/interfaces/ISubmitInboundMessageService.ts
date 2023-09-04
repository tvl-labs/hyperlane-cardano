import type { SubmitInboundMessageResponseBody } from "../../types";
import type { Checkpoint } from "../../../offchain/checkpoint";
import type { Wallet } from "../../../offchain/wallet";

export interface ISubmitInboundMessage {
  submitInboundMessage: (
    wallet: Wallet,
    checkpoint: Checkpoint,
    signatures: Buffer[]
  ) => Promise<SubmitInboundMessageResponseBody>;
}
