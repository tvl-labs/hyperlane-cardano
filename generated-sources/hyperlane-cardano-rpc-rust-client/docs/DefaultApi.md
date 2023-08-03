# \DefaultApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**estimate_inbound_message_fee**](DefaultApi.md#estimate_inbound_message_fee) | **POST** /api/inbox/estimate-message-fee | Estimate the fee in ADA to deliver an inbound message
[**get_outbound_gas_payment**](DefaultApi.md#get_outbound_gas_payment) | **POST** /api/outbox/get-message-gas-payment | Get the outbound gas payment for a message to a relayer
[**get_validator_storage_locations**](DefaultApi.md#get_validator_storage_locations) | **POST** /api/validator-announcement/get-storage-locations/ | Returns storage locations for the given validators addresses (0x prefixed 32 bytes, total length of 66 characters)
[**inbox_ism_parameters**](DefaultApi.md#inbox_ism_parameters) | **GET** /api/inbox/ism-parameters | Get the inbox ISM parameters
[**is_inbox_message_delivered**](DefaultApi.md#is_inbox_message_delivered) | **GET** /api/inbox/is-message-delivered/{messageId} | Check if an inbox message was delivered
[**last_finalized_block**](DefaultApi.md#last_finalized_block) | **GET** /api/indexer/lastFinalizedBlock | Get the last finalized block
[**merkle_tree**](DefaultApi.md#merkle_tree) | **GET** /api/indexer/merkleTree | Retrieve the MerkleTree of the latest (finalized) alive Outbox (UTXO)
[**messages_by_block_range**](DefaultApi.md#messages_by_block_range) | **GET** /api/indexer/messages/{fromBlock}/{toBlock} | Get messages from fromBlock to toBlock
[**submit_inbound_message**](DefaultApi.md#submit_inbound_message) | **POST** /api/inbox/submit-message | Submit an new inbound message



## estimate_inbound_message_fee

> crate::models::EstimateInboundMessageFee200Response estimate_inbound_message_fee(estimate_inbound_message_fee_request)
Estimate the fee in ADA to deliver an inbound message

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**estimate_inbound_message_fee_request** | [**EstimateInboundMessageFeeRequest**](EstimateInboundMessageFeeRequest.md) |  | [required] |

### Return type

[**crate::models::EstimateInboundMessageFee200Response**](estimateInboundMessageFee_200_response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## get_outbound_gas_payment

> crate::models::GetOutboundGasPayment200Response get_outbound_gas_payment(get_outbound_gas_payment_request)
Get the outbound gas payment for a message to a relayer

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**get_outbound_gas_payment_request** | [**GetOutboundGasPaymentRequest**](GetOutboundGasPaymentRequest.md) |  | [required] |

### Return type

[**crate::models::GetOutboundGasPayment200Response**](getOutboundGasPayment_200_response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## get_validator_storage_locations

> crate::models::GetValidatorStorageLocations200Response get_validator_storage_locations(get_validator_storage_locations_request)
Returns storage locations for the given validators addresses (0x prefixed 32 bytes, total length of 66 characters)

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**get_validator_storage_locations_request** | [**GetValidatorStorageLocationsRequest**](GetValidatorStorageLocationsRequest.md) |  | [required] |

### Return type

[**crate::models::GetValidatorStorageLocations200Response**](getValidatorStorageLocations_200_response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## inbox_ism_parameters

> crate::models::InboxIsmParameters200Response inbox_ism_parameters()
Get the inbox ISM parameters

### Parameters

This endpoint does not need any parameter.

### Return type

[**crate::models::InboxIsmParameters200Response**](inboxIsmParameters_200_response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## is_inbox_message_delivered

> crate::models::IsInboxMessageDelivered200Response is_inbox_message_delivered(message_id)
Check if an inbox message was delivered

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**message_id** | **String** | The message id to check | [required] |

### Return type

[**crate::models::IsInboxMessageDelivered200Response**](isInboxMessageDelivered_200_response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## last_finalized_block

> crate::models::LastFinalizedBlock200Response last_finalized_block()
Get the last finalized block

### Parameters

This endpoint does not need any parameter.

### Return type

[**crate::models::LastFinalizedBlock200Response**](lastFinalizedBlock_200_response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## merkle_tree

> crate::models::MerkleTree200Response merkle_tree()
Retrieve the MerkleTree of the latest (finalized) alive Outbox (UTXO)

### Parameters

This endpoint does not need any parameter.

### Return type

[**crate::models::MerkleTree200Response**](merkleTree_200_response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## messages_by_block_range

> crate::models::MessagesByBlockRange200Response messages_by_block_range(from_block, to_block)
Get messages from fromBlock to toBlock

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**from_block** | **i32** | Start block number | [required] |
**to_block** | **i32** | End block number | [required] |

### Return type

[**crate::models::MessagesByBlockRange200Response**](messagesByBlockRange_200_response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## submit_inbound_message

> crate::models::SubmitInboundMessage200Response submit_inbound_message(submit_inbound_message_request)
Submit an new inbound message

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**submit_inbound_message_request** | [**SubmitInboundMessageRequest**](SubmitInboundMessageRequest.md) |  | [required] |

### Return type

[**crate::models::SubmitInboundMessage200Response**](submitInboundMessage_200_response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

