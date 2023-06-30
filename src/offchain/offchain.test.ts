import { blake2bHasher } from '../merkle/hasher'
import { calculateMessageId, OutboxMessage } from './outbox/outboxMessage'
import { Address } from './address'
import { HeliosMerkleTree } from '../merkle/helios.merkle'
import { OutboxMessagePayload } from './outbox/outboxMessagePayload'

describe('off-chain', () => {
  it('off-chain', () => {
    const DOMAIN_CARDANO = 112233;
    const DOMAIN_ETHEREUM = 1;
    const merkleTree = new HeliosMerkleTree(blake2bHasher);

    const tree0 = [merkleTree.getCount(), merkleTree.root(), merkleTree.getBranches()]
    const message0: OutboxMessage = {
      version: 0,
      nonce: merkleTree.getCount(),
      originDomain: DOMAIN_CARDANO,
      sender: Address.fromHex(
        "0x0000000000000000000000000000000000000000000000000000000000000CA1"
      ),
      destinationDomain: DOMAIN_ETHEREUM,
      recipient: Address.fromHex(
        "0x0000000000000000000000000000000000000000000000000000000000000EF1"
      ),
      message: OutboxMessagePayload.fromString("Message #0"),
    };
    const messageId0 = calculateMessageId(message0)
    merkleTree.ingest(messageId0)
    const tree1 = [merkleTree.getCount(), merkleTree.root(), merkleTree.getBranches()]

    const message1 = {
      ...message0,
      nonce: merkleTree.getCount(),
      message: OutboxMessagePayload.fromString("Message #1")
    }
    const messageId1 = calculateMessageId(message1)
    merkleTree.ingest(messageId1)
    const tree2 = [merkleTree.getCount(), merkleTree.root(), merkleTree.getBranches()]

    const message2 = {
      ...message1,
      nonce: merkleTree.getCount(),
      message: OutboxMessagePayload.fromString("Message #2")
    }
    const messageId2 = calculateMessageId(message2)
    merkleTree.ingest(messageId2)
    const tree3 = [merkleTree.getCount(), merkleTree.root(), merkleTree.getBranches()]

    const object = {
      messages: [
        {
          id: messageId0,
          message: message0,
        },
        {
          id: messageId1,
          message: message1,
        },
        {
          id: messageId2,
          message: message2,
        }
      ],
      merkleTrees: [
        tree0,
        tree1,
        tree2,
        tree3
      ]
    }

    console.log(JSON.stringify(object, null, 2))
  })
})