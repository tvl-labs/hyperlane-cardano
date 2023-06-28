import * as helios from '@hyperionbt/helios'
import { ByteArray } from '@hyperionbt/helios'
import { HeliosMerkleTree } from '../../merkle/helios.merkle'
import { deserializeMerkleTree, serializeMerkleTree } from './outboxMerkle'
import { serializeMessage } from './outboxMessage'

export function serializeOutboxDatum(
  merkleTree: HeliosMerkleTree,
  message: ByteArray
) {
  return new helios.ListData([
    // Merkle tree
    serializeMerkleTree(merkleTree),
    // Latest message
    serializeMessage(message),
  ])
}

export function deserializeOutboxDatum(utxoOutbox: helios.UTxO): { merkleTree: HeliosMerkleTree } {
  const datumOutbox = utxoOutbox.origOutput.datum.data;
  const datumMerkleTree = datumOutbox.list[0];
  const merkleTree = deserializeMerkleTree(datumMerkleTree);
  return { merkleTree };
}