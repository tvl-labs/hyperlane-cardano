import { HeliosMerkleTree } from '../../merkle/helios.merkle'
import { blake2bHasher } from '../../merkle/hasher'
import { calculateMessageId, OutboxMessage } from '../../offchain/outbox/outboxMessage'
import { Address } from '../../offchain/address'
import { OutboxMessagePayload } from '../../offchain/outbox/outboxMessagePayload'
import { H256 } from '../../merkle/h256'

export type OutboxMailboxState = {
  blockNumber: number,
  message: OutboxMessage,
  messageId: H256,
  merkleTree: HeliosMerkleTree
}

const DOMAIN_CARDANO = 112233;
const DOMAIN_ETHEREUM = 1;
const SENDER = Address.fromHex(
  "0x0000000000000000000000000000000000000000000000000000000000000CA1"
)
const RECIPIENT = Address.fromHex(
  "0x0000000000000000000000000000000000000000000000000000000000000EF1"
)

export function* mockMailboxStates(initialBlockNumber: number): Generator<OutboxMailboxState, OutboxMailboxState, number> {
  const merkleTree = new HeliosMerkleTree(blake2bHasher);
  const messageTemplate: OutboxMessage = {
    version: 0,
    nonce: 0,
    originDomain: DOMAIN_CARDANO,
    sender: SENDER,
    destinationDomain: DOMAIN_ETHEREUM,
    recipient: RECIPIENT,
    message: OutboxMessagePayload.fromString("Message #0"),
  };
  let blockNumber: number = initialBlockNumber
  while (true) {
    const message = {
      ...messageTemplate,
      nonce: merkleTree.getCount(),
      message: OutboxMessagePayload.fromString(`Message #${merkleTree.getCount()}`)
    }
    const messageId = calculateMessageId(message)
    merkleTree.ingest(messageId)
    blockNumber = yield {
      message,
      messageId,
      merkleTree,
      blockNumber
    }
  }
}