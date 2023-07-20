import type { Message } from "../../offchain/message";

export interface IIsInboxMessageDelivered {
  getIsInboxMessageDelivered: (message: Message) => Promise<boolean>;
}
