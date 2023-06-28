import * as helios from '@hyperionbt/helios'
import { ByteArray } from '@hyperionbt/helios'
import { blake2bHasher } from '../../merkle/hasher'

export function serializeOutboxRedeemer(
  version: ByteArray,
  nonce: ByteArray,
  originDomain: ByteArray,
  sender: ByteArray,
  destinationDomain: ByteArray,
  recipient: ByteArray
) {
  return new helios.ListData([
    version._toUplcData(),
    nonce._toUplcData(),
    originDomain._toUplcData(),
    sender._toUplcData(),
    destinationDomain._toUplcData(),
    recipient._toUplcData(),
  ])
}

export function serializeMessage(message: ByteArray) {
  return message._toUplcData()
}

export function calculateMessageId(
  version: ByteArray,
  nonce: ByteArray,
  originDomain: ByteArray,
  sender: ByteArray,
  destinationDomain: ByteArray,
  recipient: ByteArray,
  message: ByteArray
) {
  return blake2bHasher(Buffer.concat([
    Buffer.from(version.bytes),
    Buffer.from(nonce.bytes),
    Buffer.from(originDomain.bytes),
    Buffer.from(sender.bytes),
    Buffer.from(destinationDomain.bytes),
    Buffer.from(recipient.bytes),
    Buffer.from(message.bytes),
  ]))
}