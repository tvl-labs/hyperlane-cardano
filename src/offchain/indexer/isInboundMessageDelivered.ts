import type { IsmParamsHelios } from "../inbox/ismParams";
import { getInboxUTxO } from "./getInboxUTxO";
import type { H256 } from "../h256";

export async function isInboundMessageDelivered(
  ismParams: IsmParamsHelios,
  messageId: H256
): Promise<boolean> {
  const inboxUTxO = await getInboxUTxO(ismParams);
  if (inboxUTxO == null) return false;
  if (inboxUTxO.origOutput.datum?.data == null) return false;
  const messages = JSON.parse(
    inboxUTxO.origOutput.datum.data.toSchemaJson()
  ).list.map((ba) => ba.bytes);
  return messages.includes(messageId.hex().substring(2));
}
