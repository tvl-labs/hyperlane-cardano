/*
 * Outbox RPC API
 *
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: 1.0.0
 * 
 * Generated by: https://openapi-generator.tech
 */




#[derive(Clone, Debug, PartialEq, Default, Serialize, Deserialize)]
pub struct MerkleTree200Response {
    #[serde(rename = "blockNumber")]
    pub block_number: i32,
    #[serde(rename = "merkleTree")]
    pub merkle_tree: Box<crate::models::MerkleTree200ResponseMerkleTree>,
}

impl MerkleTree200Response {
    pub fn new(block_number: i32, merkle_tree: crate::models::MerkleTree200ResponseMerkleTree) -> MerkleTree200Response {
        MerkleTree200Response {
            block_number,
            merkle_tree: Box::new(merkle_tree),
        }
    }
}


