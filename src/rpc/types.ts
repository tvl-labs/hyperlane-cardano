import type { operations, paths } from "./openapi";

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

export type DispatchMessageRequestBody =
  paths["/api/outbox/dispatch"]["post"]["requestBody"]["content"]["application/json"];
export type DispatchMessageResponseType =
  paths["/api/outbox/dispatch"]["post"]["responses"]["200"]["content"]["application/json"];
