// Common constants for all Merkle Tree implementations.

import { hashConcat, type Hasher } from "../offchain/hasher";
import { H256 } from "../offchain/h256";

export const TREE_DEPTH = 32;
export const MAX_LEAVES = 4294967295; // 2 ^ TREE_DEPTH - 1

export function zeroNode(hasher: Hasher, depth: number) {
  let zero = H256.zero();
  for (let i = 0; i < depth; i++) {
    zero = hashConcat(hasher, zero, zero);
  }
  return zero;
}
