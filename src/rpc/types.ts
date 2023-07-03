import type { operations } from "./openapi";

export type LastFinalizedBlockResponseType =
  operations["lastFinalizedBlock"]["responses"]["200"]["content"]["application/json"];
export type MerkleTreesByBlockNumberResponseType =
  operations["merkleTreesByBlockNumber"]["responses"]["200"]["content"]["application/json"];
export type MerkleTreeType =
  MerkleTreesByBlockNumberResponseType["merkleTrees"][number];
export type MessagesByBlockRangeResponseType =
  operations["messagesByBlockRange"]["responses"]["200"]["content"]["application/json"];
export type MessageResponseType =
  MessagesByBlockRangeResponseType["messages"][number]["message"];
