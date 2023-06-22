import { HeliosMerkleTree } from '../../merkle/helios.merkle';
import { H256 } from '../../merkle/h256';
import { blake2bHasher } from '../../merkle/hasher';
import * as helios from '@hyperionbt/helios';

export function parseMerkleTree(merkleTree: any): HeliosMerkleTree {
  const branches: H256[] = merkleTree[0].list.map((b) => H256.from(Buffer.from(b.bytes)));
  const count = parseInt(merkleTree[1].int.toString());
  return HeliosMerkleTree.createFrom(blake2bHasher, count, branches);
}

export function serializeMerkleTree(merkleTree: HeliosMerkleTree): helios.ListData {
  return new helios.ListData([
    new helios.ListData(
      merkleTree.getBranches()
        .map((h) => new helios.ByteArray(h.toByteArray()))
        .map((h) => h._toUplcData())
    ),
    new helios.IntData(BigInt(merkleTree.getCount()))
  ])
}