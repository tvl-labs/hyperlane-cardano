import { blake2bHasher } from '../../merkle/hasher'
import { Address } from '../address'
import { Buffer } from 'buffer'
import { OutboxMessagePayload } from './outboxMessagePayload'

const VERSION_SIZE = 1
const NONCE_SIZE = 4
const ORIGIN_DOMAIN_SIZE = 4
const SENDER_SIZE = 32
const DESTINATION_DOMAIN_SIZE = 4
const RECIPIENT_SIZE = 32

export type OutboxMessage = {
  /**
   * 1-byte version of the messaging protocol.
   */
  version: 0,
  /**
   * 4-byte nonce sequential number of the message equal to the Outbox's MerkleTree count.
   */
  nonce: number,
  /**
   * 4-byte number of the Hyperlane-provided origin domain (Ethereum = 1, Polygon = 137, etc)
   */
  originDomain: number,
  /**
   * 32-byte address of the sender on Cardano.
   */
  sender: Address,
  /**
   * 4-byte number of the Hyperlane-provided destination domain (Ethereum = 1, Polygon = 137, etc)
   */
  destinationDomain: number,
  /**
   * 32-byte address of the recipient.
   */
  recipient: Address,
  /**
   * Message payload, arbitrary size below ~1Kb.
   */
  message: OutboxMessagePayload
}

export function calculateMessageId(
  outboxMessage: OutboxMessage
) {
  const buffer = Buffer.alloc(
    VERSION_SIZE +
    NONCE_SIZE +
    ORIGIN_DOMAIN_SIZE +
    SENDER_SIZE +
    DESTINATION_DOMAIN_SIZE +
    RECIPIENT_SIZE +
    outboxMessage.message.sizeInBytes()
  )
  let offset = 0
  buffer.writeUint8(outboxMessage.version, offset)
  offset += VERSION_SIZE
  buffer.writeUint32BE(outboxMessage.nonce, offset)
  offset += NONCE_SIZE
  buffer.writeUint32BE(outboxMessage.originDomain, offset)
  offset += ORIGIN_DOMAIN_SIZE
  outboxMessage.sender.toBuffer().copy(buffer, offset)
  offset += SENDER_SIZE
  buffer.writeUint32BE(outboxMessage.destinationDomain, offset)
  offset += DESTINATION_DOMAIN_SIZE
  outboxMessage.recipient.toBuffer().copy(buffer, offset)
  offset += RECIPIENT_SIZE
  outboxMessage.message.toBuffer().copy(buffer, offset)
  return blake2bHasher(buffer)
}