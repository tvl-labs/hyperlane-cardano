import { HeliosMerkleTree } from "../../merkle/helios.merkle";
import { blake2bHasher } from "../../merkle/hasher";
import {
  calculateMessageId,
  type OutboxMessage,
} from "../../offchain/outbox/outboxMessage";
import type { H256 } from "../../merkle/h256";
import { type OutboxDispatchedMessage } from "../outbox/outboxDispatchedMessage";

import { DOMAIN_CARDANO } from "./cardanoDomain";

export interface OutboxNextDispatchPayload {
  blockNumber: number;
  message: OutboxDispatchedMessage;
}

export interface OutboxMailboxState {
  blockNumber: number;
  message: OutboxMessage;
  messageId: H256;
  merkleTree: HeliosMerkleTree;
}

/**
 * Mimic the state changes of the Outbox. Each `.next()` should provide the next message and corresponding block number.
 * The very first .next() returns a null and should be ignored.
 */
export function* outboxStatesGenerator(): Generator<
OutboxMailboxState,
OutboxMailboxState,
OutboxNextDispatchPayload
> {
  const merkleTree = new HeliosMerkleTree(blake2bHasher);
  let dispatchPayload = yield null as unknown as OutboxMailboxState;
  while (true) {
    const message: OutboxMessage = {
      ...dispatchPayload.message,
      version: 0,
      nonce: merkleTree.getCount(),
      originDomain: DOMAIN_CARDANO,
      message: dispatchPayload.message.message,
    };
    const messageId = calculateMessageId(message);
    merkleTree.ingest(messageId);
    dispatchPayload = yield {
      message,
      messageId,
      merkleTree,
      blockNumber: dispatchPayload.blockNumber,
    };
  }
}
