import { hashConcat, type Hasher } from "./hasher";
import { H256 } from "./h256";
import { MAX_LEAVES, TREE_DEPTH, zeroNode } from "./common.merkle";
import assert from "assert";

// Typescript mirror of the Helios MerkleTree implementation:
// `hyperlane-cardano/src/onchain/scriptOutbox.hl`
export class HeliosMerkleTree {
  private readonly hasher: Hasher;
  private branches: H256[]; // TREE_DEPTH size.
  private count: number = 0;

  constructor(hasher: Hasher) {
    this.branches = new Array<H256>(TREE_DEPTH);
    for (let i = 0; i < TREE_DEPTH; i++) {
      this.branches[i] = H256.zero();
    }
    this.hasher = hasher;
  }

  static createFrom(
    hasher: Hasher,
    count: number,
    branches: H256[]
  ): HeliosMerkleTree {
    const merkleTree = new HeliosMerkleTree(hasher);
    merkleTree.count = count;
    merkleTree.branches = branches;
    return merkleTree;
  }

  updateBranches(i: number, size: number, node: H256): H256[] {
    assert(i < TREE_DEPTH);
    if (size % 2 === 1) {
      const newBranches = [
        ...this.branches.slice(0, i),
        node,
        ...this.branches.slice(i + 1),
      ];
      assert(newBranches.length === TREE_DEPTH);
      return newBranches;
    }
    return this.updateBranches(
      i + 1,
      size / 2,
      hashConcat(this.hasher, this.branches[i], node)
    );
  }

  ingest(node: H256) {
    assert(this.count < MAX_LEAVES);
    this.branches = this.updateBranches(0, this.count + 1, node);
    this.count++;
  }

  getCount(): number {
    return this.count;
  }

  getBranches(): H256[] {
    return [...this.branches];
  }

  root(): H256 {
    const index = this.count;
    let current = H256.zero();
    for (let i = 0; i < TREE_DEPTH; i++) {
      const ithBit = (index >> i) & 0x01;
      const next = this.branches[i];
      if (ithBit === 1) {
        current = hashConcat(this.hasher, next, current);
      } else {
        current = hashConcat(this.hasher, current, zeroNode(this.hasher, i));
      }
    }
    return current;
  }
}
