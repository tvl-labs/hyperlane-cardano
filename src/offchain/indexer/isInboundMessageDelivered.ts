import * as helios from "@hyperionbt/helios";
import type { IsmParamsHelios } from "../inbox/ismParams";
import { getInboxUTxO } from "./getInboxUTxO";
import type { H256 } from "../h256";

export async function isInboundMessageDelivered(
  ismParams: IsmParamsHelios,
  messageId: H256
): Promise<boolean> {
  const inboxUTxO = await getInboxUTxO(ismParams);
  if (inboxUTxO == null) return false;
  const deliveredMessages = inboxUTxO.origOutput.datum.data.list.map((ba) =>
    helios.bytesToHex(ba.bytes)
  );
  return deliveredMessages.includes(messageId.hex().substring(2));
}
