import type { H256 } from "../../merkle/h256";

export interface IIsInboxMessageDelivered {
  getIsInboxMessageDelivered: (message: H256) => Promise<boolean>;
}
