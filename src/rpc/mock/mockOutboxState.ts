import { HeliosMerkleTree } from "../../merkle/helios.merkle";
import { blake2bHasher } from "../../merkle/hasher";
import { calculateMessageId, type Message } from "../../offchain/message";
import type { H256 } from "../../offchain/h256";
import { DOMAIN_CARDANO } from "./cardanoDomain";
import { type DispatchedMessage } from "../outbox/dispatchedMessage";
import { Address } from "../../offchain/address";

export interface OutboxNextDispatchPayload {
  blockNumber: number;
  message: DispatchedMessage;
}

export interface OutboxMailboxState {
  blockNumber: number;
  message: Message;
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
    const message: Message = {
      ...dispatchPayload.message,
      version: 0,
      nonce: merkleTree.getCount(),
      originDomain: DOMAIN_CARDANO,
      sender: Address.fromHex(
        "0x0000000000000000000000000000000000000000000000000000000000000EF1"
      ),
      body: dispatchPayload.message.body,
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
