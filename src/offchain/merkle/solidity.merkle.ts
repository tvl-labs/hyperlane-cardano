import { H256 } from "../h256";
import assert from "assert";
import { hashConcat, type Hasher } from "../hasher";
import { MAX_LEAVES, TREE_DEPTH, zeroNode } from "./common.merkle";

// Hyperlane Solidity implementation of the MerkleTree
//  https://github.com/hyperlane-xyz/hyperlane-monorepo/blob/50f04db1faddb6d471b85386bb977fe9762753df/solidity/contracts/libs/Merkle.sol#L11-L10
export class SolidityMerkleTree {
  private readonly hasher: Hasher;
  private readonly branch: H256[]; // TREE_DEPTH size.
  private count: number = 0;

  constructor(hasher: Hasher) {
    this.branch = new Array<H256>(TREE_DEPTH);
    for (let i = 0; i < TREE_DEPTH; i++) {
      this.branch[i] = H256.zero();
    }
    this.hasher = hasher;
  }

  ingest(node: H256) {
    assert(this.count < MAX_LEAVES);
    this.count++;
    let size = this.count;
    for (let i = 0; i < TREE_DEPTH; i++) {
      if ((size & 1) === 1) {
        this.branch[i] = node;
        return;
      }
      node = hashConcat(this.hasher, this.branch[i], node);
      size /= 2;
    }
    assert(false);
  }

  root(): H256 {
    const index = this.count;
    let current = H256.zero();
    for (let i = 0; i < TREE_DEPTH; i++) {
      const ithBit = (index >> i) & 0x01;
      const next = this.branch[i];
      if (ithBit === 1) {
        current = hashConcat(this.hasher, next, current);
      } else {
        current = hashConcat(this.hasher, current, zeroNode(this.hasher, i));
      }
    }
    return current;
  }
}
