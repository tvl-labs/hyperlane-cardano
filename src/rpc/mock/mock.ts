import { mockMailboxStates } from "./mockOutboxState";
import type {
  LastFinalizedBlockResponseType,
  MerkleTreeResponseType,
  MessageResponseType,
  MessagesByBlockRangeResponseType,
} from "../types";
import type { Message } from "../../offchain/message";

export const LAST_FINALIZED_BLOCK_NUMBER = 10;

export const MOCK_STATES = createMockMessages();

export function createMockMessages() {
  const statesGenerator = mockMailboxStates(3);
  return [
    statesGenerator.next().value,
    statesGenerator.next(5).value,
    statesGenerator.next(8).value,
  ];
}

export function getLastFinalizedBlockNumber(): LastFinalizedBlockResponseType {
  return {
    lastFinalizedBlock: LAST_FINALIZED_BLOCK_NUMBER,
  };
}

export function getMerkleTree(): MerkleTreeResponseType {
  const latestState = MOCK_STATES[MOCK_STATES.length - 1];
  return {
    blockNumber: latestState.blockNumber,
    merkleTree: {
      count: latestState.merkleTree.getCount(),
      branches: latestState.merkleTree.getBranches().map((h) => h.hex()),
    },
  };
}

export function getMessagesInBlockRange(
  fromBlock: number,
  toBlock: number
): MessagesByBlockRangeResponseType {
  return {
    messages: MOCK_STATES.filter(
      (ms) => fromBlock <= ms.blockNumber && ms.blockNumber <= toBlock
    ).map((ms) => ({
      block: ms.blockNumber,
      message: convertMessageResponseType(ms.message),
    })),
  };
}

function convertMessageResponseType(
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
