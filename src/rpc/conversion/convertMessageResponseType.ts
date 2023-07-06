import { type OutboxMessage } from "../../offchain/outbox/outboxMessage";
import { type MessageResponseType } from "../types";

export function convertMessageResponseType(
  outboxMessage: OutboxMessage
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
