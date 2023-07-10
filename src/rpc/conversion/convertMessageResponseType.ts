import { type MessageResponseType } from "../types";
import { type Message } from "../../offchain/message";

export function convertMessageResponseType(
  outboxMessage: Message
): MessageResponseType {
  return {
    version: outboxMessage.version,
    nonce: outboxMessage.nonce,
    originDomain: outboxMessage.originDomain,
    sender: outboxMessage.sender.toHex(),
    destinationDomain: outboxMessage.destinationDomain,
    recipient: outboxMessage.recipient.toHex(),
    body: outboxMessage.message.toHex(),
  };
}
