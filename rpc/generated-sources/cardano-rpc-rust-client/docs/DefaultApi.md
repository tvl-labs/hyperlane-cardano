# \DefaultApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**api_outbox_messages_get**](DefaultApi.md#api_outbox_messages_get) | **GET** /api/outbox/messages | Get all messages from the outbox
[**last_finalized_block**](DefaultApi.md#last_finalized_block) | **GET** /api/indexer/lastFinalizedBlock | Get the last finalized block
[**merkle_tree_by_block_number**](DefaultApi.md#merkle_tree_by_block_number) | **GET** /api/indexer/merkleTree/{blockNumber} | Get the MerkleTree that was in the OutboxUtxo at the given blockNumber
[**messages_by_block_range**](DefaultApi.md#messages_by_block_range) | **GET** /api/indexer/messages/{fromBlock}/{toBlock} | Get messages from fromBlock to toBlock



## api_outbox_messages_get

> Vec<crate::models::Message> api_outbox_messages_get()
Get all messages from the outbox

### Parameters

This endpoint does not need any parameter.

### Return type

[**Vec<crate::models::Message>**](Message.md)

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


## merkle_tree_by_block_number

> crate::models::MerkleTreeByBlockNumber200Response merkle_tree_by_block_number(block_number)
Get the MerkleTree that was in the OutboxUtxo at the given blockNumber

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**block_number** | **i32** | Block number to retrieve the MerkleTree | [required] |

### Return type

[**crate::models::MerkleTreeByBlockNumber200Response**](merkleTreeByBlockNumber_200_response.md)

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

