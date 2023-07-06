import { DispatchMessageRequestBody } from '../types';
import { OutboxDispatchedMessage } from '../outbox/outboxDispatchedMessage';
import { Address } from '../../offchain/address';
import { OutboxMessagePayload } from '../../offchain/outbox/outboxMessagePayload';

export function convertDispatchMessageRequestBody(requestBody: DispatchMessageRequestBody): OutboxDispatchedMessage {
  return {
    sender: Address.fromHex(requestBody.sender),
    destinationDomain: requestBody.destinationDomain,
    recipient: Address.fromHex(requestBody.recipient),
    message: OutboxMessagePayload.fromHexString(requestBody.body)
  };
}