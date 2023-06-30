import { mockMailboxStates } from './mockOutboxState'
import {
  LastFinalizedBlockResponseType,
  MerkleTreesByBlockNumberResponseType,
  MessageResponseType,
  MessagesByBlockRangeResponseType
} from '../types'
import { OutboxMessage } from '../../offchain/outbox/outboxMessage'

export const LAST_FINALIZED_BLOCK_NUMBER = 10

export const MOCK_STATES = createMockMessages()

export function createMockMessages() {
  const statesGenerator = mockMailboxStates(3)
  return [
    statesGenerator.next().value,
    statesGenerator.next(5).value,
    statesGenerator.next(8).value
  ]
}

export function getLastFinalizedBlockNumber(): LastFinalizedBlockResponseType {
  return {
    lastFinalizedBlock: LAST_FINALIZED_BLOCK_NUMBER
  }
}

export function getMerkleTreesAtBlockNumber(blockNumber: number): MerkleTreesByBlockNumberResponseType {
  let states = MOCK_STATES.filter((ms) => ms.blockNumber === blockNumber)
  if (!states.length) {
    const previousStates = MOCK_STATES.filter((ms) => ms.blockNumber < blockNumber)
    if (!previousStates.length) {
      return {
        blockNumber,
        merkleTrees: []
      }
    }
    states = [previousStates[previousStates.length - 1]]
  }
  const merkleTrees = states.map((ms) => ({
    count: ms.merkleTree.getCount(),
    branches: ms.merkleTree.getBranches().map((h) => h.hex())
  }))
  return {
    blockNumber,
    merkleTrees
  }
}

export function getMessagesInBlockRange(
  fromBlock: number,
  toBlock: number
): MessagesByBlockRangeResponseType {
  return {
    messages: MOCK_STATES
      .filter((ms) => fromBlock <= ms.blockNumber && ms.blockNumber <= toBlock)
      .map((ms) => ({
        block: ms.blockNumber,
        message: convertMessageResponseType(ms.message)
      }))
  }
}

function convertMessageResponseType(outboxMessage: OutboxMessage): MessageResponseType {
  return {
    version: outboxMessage.version,
    nonce: outboxMessage.nonce,
    // TODO: make number in OpenAPI.
    originDomain: outboxMessage.originDomain.toString(),
    sender: outboxMessage.sender.toHex(),
    // TODO: make number in OpenAPI.
    destinationDomain: outboxMessage.destinationDomain.toString(),
    recipient: outboxMessage.recipient.toHex(),
    body: outboxMessage.message.toHex()
  }
}