import * as helios from '@hyperionbt/helios'
import { HeliosMerkleTree } from '../../merkle/helios.merkle'
import { deserializeMerkleTree } from './outboxMerkle'

export function deserializeOutboxDatum(utxoOutbox: helios.UTxO): { merkleTree: HeliosMerkleTree } {
  const datumOutbox = utxoOutbox.origOutput.datum.data;
  const datumMerkleTree = datumOutbox.list[0];
  const merkleTree = deserializeMerkleTree(datumMerkleTree);
  return { merkleTree };
}