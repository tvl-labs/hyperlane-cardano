import { type IIsInboxMessageDelivered } from "./IIsInboxMessageDelivered";
import {
  getIsmParamsHelios,
  isInboundMessageDelivered,
} from "../../offchain/inbox";
import type { H256 } from "../../offchain/h256";

export class IsInboxMessageDeliveredService
  implements IIsInboxMessageDelivered
{
  async getIsInboxMessageDelivered(messageId: H256): Promise<boolean> {
    return await isInboundMessageDelivered(getIsmParamsHelios(), messageId);
  }
}
