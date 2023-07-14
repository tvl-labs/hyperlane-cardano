# \DefaultApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**get_validator_storage_locations**](DefaultApi.md#get_validator_storage_locations) | **POST** /api/validator-announcement/get-storage-locations/ | Returns storage locations for the given validators addresses (0x prefixed 32 bytes, total length of 66 characters)
[**last_finalized_block**](DefaultApi.md#last_finalized_block) | **GET** /api/indexer/lastFinalizedBlock | Get the last finalized block
[**merkle_tree**](DefaultApi.md#merkle_tree) | **GET** /api/indexer/merkleTree | Retrieve the MerkleTree of the latest (finalized) alive Outbox (UTXO)
[**messages_by_block_range**](DefaultApi.md#messages_by_block_range) | **GET** /api/indexer/messages/{fromBlock}/{toBlock} | Get messages from fromBlock to toBlock



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

