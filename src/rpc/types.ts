import type { operations } from "./openapi";

export type LastFinalizedBlockResponseType =
  operations["lastFinalizedBlock"]["responses"]["200"]["content"]["application/json"];
export type MerkleTreeResponseType =
  operations["merkleTree"]["responses"]["200"]["content"]["application/json"];
export type MessagesByBlockRangeResponseType =
  operations["messagesByBlockRange"]["responses"]["200"]["content"]["application/json"];
export type MessageResponseType =
  MessagesByBlockRangeResponseType["messages"][number]["message"];

export type GetValidatorStorageLocationsRequestBody =
  operations["getValidatorStorageLocations"]["requestBody"]["content"]["application/json"];
export type GetValidatorStorageLocationsResponseBody =
  operations["getValidatorStorageLocations"]["responses"]["200"]["content"]["application/json"];

export type InboxIsmParametersResponseType =
  operations["inboxIsmParameters"]["responses"]["200"]["content"]["application/json"];

export type IsInboxMessageDeliveredRequestBody =
  operations["isInboxMessageDelivered"]["requestBody"]["content"]["application/json"];
export type IsInboxMessageDeliveredResponseBody =
  operations["isInboxMessageDelivered"]["responses"]["200"]["content"]["application/json"];
