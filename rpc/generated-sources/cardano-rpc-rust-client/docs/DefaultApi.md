# \DefaultApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**last_finalized_block**](DefaultApi.md#last_finalized_block) | **GET** /api/indexer/lastFinalizedBlock | Get the last finalized block
[**merkle_trees_by_block_number**](DefaultApi.md#merkle_trees_by_block_number) | **GET** /api/indexer/merkleTrees/{blockNumber} |  Retrieve the states of the MerkleTree corresponding to the specified 'blockNumber'. The behavior depends on the number and presence of dispatched messages within the block. - If there are no dispatched messages at 'blockNumber', the method returns the MerkleTree state following the most recent dispatched message from a previous block, or an empty MerkleTree if no prior messages exist. - If there's only a single dispatched message within 'blockNumber', the method returns the MerkleTree state after processing this message. - If 'blockNumber' contains multiple dispatched messages, the method returns the sequence of MerkleTree states corresponding to each dispatched message, in the order of their processing. 
[**messages_by_block_range**](DefaultApi.md#messages_by_block_range) | **GET** /api/indexer/messages/{fromBlock}/{toBlock} | Get messages from fromBlock to toBlock



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


## merkle_trees_by_block_number

> crate::models::MerkleTreesByBlockNumber200Response merkle_trees_by_block_number(block_number)
 Retrieve the states of the MerkleTree corresponding to the specified 'blockNumber'. The behavior depends on the number and presence of dispatched messages within the block. - If there are no dispatched messages at 'blockNumber', the method returns the MerkleTree state following the most recent dispatched message from a previous block, or an empty MerkleTree if no prior messages exist. - If there's only a single dispatched message within 'blockNumber', the method returns the MerkleTree state after processing this message. - If 'blockNumber' contains multiple dispatched messages, the method returns the sequence of MerkleTree states corresponding to each dispatched message, in the order of their processing. 

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**block_number** | **i32** | Block number to retrieve the MerkleTree | [required] |

### Return type

[**crate::models::MerkleTreesByBlockNumber200Response**](merkleTreesByBlockNumber_200_response.md)

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

