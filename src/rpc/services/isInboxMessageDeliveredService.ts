import { type IIsInboxMessageDelivered } from "./IIsInboxMessageDelivered";
import { type Message } from "../../offchain/message";
import {
  getIsmParamsHelios,
  isInboundMessageDelivered,
} from "../../offchain/inbox";

export class IsInboxMessageDeliveredService
  implements IIsInboxMessageDelivered
{
  async getIsInboxMessageDelivered(message: Message): Promise<boolean> {
    return await isInboundMessageDelivered(getIsmParamsHelios(), message);
  }
}
