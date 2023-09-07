import { HeliosMerkleTree } from "../merkle/helios.merkle";
import { H256 } from "../h256";
import { blake2bHasher } from "../hasher";
import * as helios from "@hyperionbt/helios";
import assert from "assert";
import { TREE_DEPTH } from "../merkle/common.merkle";

export function deserializeMerkleTree(datumMerkleTree: any): HeliosMerkleTree {
  assert(datumMerkleTree.length === 2);
  const [datumBranches, datumCount] = datumMerkleTree;

  assert(
    datumBranches.list.length === TREE_DEPTH,
    `Invalid MerkleTree Datum. Branches length ${
      datumBranches.list.length as number
    } and must be ${TREE_DEPTH}`
  );
  const branches = datumBranches.list.map((branch) =>
    H256.from(Buffer.from(branch.bytes, "hex"))
  );
  const count = Number(datumCount.int);

  return HeliosMerkleTree.createFrom(blake2bHasher, count, branches);
}

export function serializeMerkleTree(
  merkleTree: HeliosMerkleTree
): helios.ListData {
  return new helios.ListData([
    new helios.ListData(
      merkleTree
        .getBranches()
        .map((h) => new helios.ByteArrayData(h.toByteArray()))
    ),
    new helios.IntData(BigInt(merkleTree.getCount())),
  ]);
}
