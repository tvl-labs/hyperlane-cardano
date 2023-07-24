import type * as helios from "@hyperionbt/helios";
import { type ISubmitInboundMessage } from "./ISubmitInboundMessageService";
import { getIsmParamsHelios, createInboundMessage } from "../../offchain/inbox";
import type { Checkpoint } from "../../offchain/checkpoint";
import type { Wallet } from "../../offchain/wallet";

export class SubmitInboundMessageService implements ISubmitInboundMessage {
  async submitInboundMessage(
    wallet: Wallet,
    checkpoint: Checkpoint,
    signatures: Buffer[]
  ): Promise<helios.TxId> {
    return await createInboundMessage(
      getIsmParamsHelios(),
      checkpoint,
      signatures,
      wallet
    );
  }
}
