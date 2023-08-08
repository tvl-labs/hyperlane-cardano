import { type ISubmitInboundMessage } from "./ISubmitInboundMessageService";
import type { SubmitInboundMessageResponseBody } from "../types";
import { getIsmParamsHelios, createInboundMessage } from "../../offchain/inbox";
import type { Checkpoint } from "../../offchain/checkpoint";
import type { Wallet } from "../../offchain/wallet";

export class SubmitInboundMessageService implements ISubmitInboundMessage {
  async submitInboundMessage(
    wallet: Wallet,
    checkpoint: Checkpoint,
    signatures: Buffer[]
  ): Promise<SubmitInboundMessageResponseBody> {
    return await createInboundMessage(
      getIsmParamsHelios(),
      checkpoint,
      signatures,
      wallet
    );
  }
}
