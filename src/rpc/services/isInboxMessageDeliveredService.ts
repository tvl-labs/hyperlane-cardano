import * as helios from "@hyperionbt/helios";
import { type IIsInboxMessageDelivered } from "./IIsInboxMessageDelivered";
import {
  getIsmParamsHelios,
  isInboundMessageDelivered,
} from "../../offchain/inbox";
import type { H256 } from "../../merkle/h256";

export class IsInboxMessageDeliveredService
  implements IIsInboxMessageDelivered
{
  async getIsInboxMessageDelivered(messageId: H256): Promise<boolean> {
    return await isInboundMessageDelivered(
      getIsmParamsHelios(
        new helios.TxOutputId(process.env.ISM_OUTPUT_ID ?? "")
      ),
      messageId
    );
  }
}
