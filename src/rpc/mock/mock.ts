import {
  type OutboxMailboxState,
  outboxStatesGenerator,
} from "./mockOutboxState";
import { type DispatchedMessage } from "../outbox/dispatchedMessage";
import { type H256 } from "../../offchain/h256";

export let mockLastFinalizedBlock = 0;

export const mockOutboxMailboxStates: OutboxMailboxState[] = [];

const statesGenerator = outboxStatesGenerator();
statesGenerator.next(); // Skip the first null result.

export function updateLastFinalizedBlock(blockNumber: number) {
  mockLastFinalizedBlock = blockNumber;
}

export function dispatchNewMessage(dispatchedMessage: DispatchedMessage): H256 {
  mockLastFinalizedBlock += 1;
  const nextState = statesGenerator.next({
    message: dispatchedMessage,
    blockNumber: mockLastFinalizedBlock,
  }).value;
  mockOutboxMailboxStates.push(nextState);
  return nextState.messageId;
}
