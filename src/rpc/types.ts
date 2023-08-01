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

export type IsInboxMessageDeliveredResponseBody =
  operations["isInboxMessageDelivered"]["responses"]["200"]["content"]["application/json"];

export type EstimateInboxMessageFeeRequestBody =
  operations["estimateInboundMessageFee"]["requestBody"]["content"]["application/json"];
export type EstimateInboxMessageFeeResponseBody =
  operations["estimateInboundMessageFee"]["responses"]["200"]["content"]["application/json"];

export type SubmitInboundMessageRequestBody =
  operations["submitInboundMessage"]["requestBody"]["content"]["application/json"];
export type SubmitInboundMessageResponseBody =
  operations["submitInboundMessage"]["responses"]["200"]["content"]["application/json"];

export type GetOutboundGasPaymentRequestBody =
  operations["getOutboundGasPayment"]["requestBody"]["content"]["application/json"];
export type GetOutboundGasPaymentResponseBody =
  operations["getOutboundGasPayment"]["responses"]["200"]["content"]["application/json"];
