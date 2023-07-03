import { mockMailboxStates } from "./mockOutboxState";
import type {
  LastFinalizedBlockResponseType,
  MerkleTreesByBlockNumberResponseType,
  MessageResponseType,
  MessagesByBlockRangeResponseType,
} from "../types";
import type { OutboxMessage } from "../../offchain/outbox/outboxMessage";

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

export function getMerkleTreesAtBlockNumber(
  blockNumber: number
): MerkleTreesByBlockNumberResponseType {
  let states = MOCK_STATES.filter((ms) => ms.blockNumber === blockNumber);
  if (states.length === 0) {
    const previousStates = MOCK_STATES.filter(
      (ms) => ms.blockNumber < blockNumber
    );
    if (previousStates.length === 0) {
      return {
        blockNumber,
        merkleTrees: [],
      };
    }
    states = [previousStates[previousStates.length - 1]];
  }
  const merkleTrees = states.map((ms) => ({
    count: ms.merkleTree.getCount(),
    branches: ms.merkleTree.getBranches().map((h) => h.hex()),
  }));
  return {
    blockNumber,
    merkleTrees,
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
