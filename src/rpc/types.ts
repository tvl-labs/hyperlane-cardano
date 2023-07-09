import type { operations } from "./openapi";

export type LastFinalizedBlockResponseType =
  operations["lastFinalizedBlock"]["responses"]["200"]["content"]["application/json"];
export type MerkleTreeResponseType =
  operations["merkleTree"]["responses"]["200"]["content"]["application/json"];
export type MessagesByBlockRangeResponseType =
  operations["messagesByBlockRange"]["responses"]["200"]["content"]["application/json"];
export type MessageResponseType =
  MessagesByBlockRangeResponseType["messages"][number]["message"];
