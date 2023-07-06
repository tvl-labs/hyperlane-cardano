import { OutboxMailboxState, outboxStatesGenerator } from "./mockOutboxState";
import { OutboxDispatchedMessage } from '../outbox/outboxDispatchedMessage';
import { H256 } from '../../merkle/h256';

export var mockLastFinalizedBlock = 0;

export const mockOutboxMailboxStates: OutboxMailboxState[] = [];

const statesGenerator = outboxStatesGenerator();
statesGenerator.next() // Skip the first null result.

export function updateLastFinalizedBlock(blockNumber: number) {
  mockLastFinalizedBlock = blockNumber;
}

export function dispatchNewMessage(outboxDispatchedMessage: OutboxDispatchedMessage): H256 {
  mockLastFinalizedBlock += 1;
  const nextState = statesGenerator.next({
    message: outboxDispatchedMessage,
    blockNumber: mockLastFinalizedBlock
  }).value;
  mockOutboxMailboxStates.push(nextState);
  return nextState.messageId
}
