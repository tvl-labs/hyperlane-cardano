import { HeliosMerkleTree } from "../merkle/helios.merkle";
import { H256 } from "../h256";
import { blake2bHasher } from "../hasher";
import * as helios from "@hyperionbt/helios";
import type { UplcData } from "@hyperionbt/helios";
import assert from "assert";
import { TREE_DEPTH } from "../merkle/common.merkle";

export function deserializeMerkleTree(
  datumMerkleTree: UplcData
): HeliosMerkleTree {
  assert(datumMerkleTree.list.length === 2);
  const datumBranches = datumMerkleTree.list[0];
  const datumCount = datumMerkleTree.list[1];

  assert(
    datumBranches.list.length === TREE_DEPTH,
    `Invalid MerkleTree Datum. Branches length ${datumBranches.list.length} and must be ${TREE_DEPTH}`
  );
  const branches = datumBranches.list.map((branch) =>
    H256.from(Buffer.from(branch.bytes))
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
        .map((h) => new helios.ByteArray(h.toByteArray())._toUplcData())
    ),
    new helios.IntData(BigInt(merkleTree.getCount())),
  ]);
}
