import type * as helios from "@hyperionbt/helios";
import type { Checkpoint } from "../../offchain/checkpoint";
import type { Wallet } from "../../offchain/wallet";

export interface ISubmitInboundMessage {
  submitInboundMessage: (
    wallet: Wallet,
    checkpoint: Checkpoint,
    signatures: Uint8Array[]
  ) => Promise<helios.TxId>;
}
