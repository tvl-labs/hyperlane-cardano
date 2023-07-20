/*
 * Hyperlane <> Cardano RPC API
 *
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: 1.0.0
 * 
 * Generated by: https://openapi-generator.tech
 */




#[derive(Clone, Debug, PartialEq, Default, Serialize, Deserialize)]
pub struct GetValidatorStorageLocationsRequest {
    #[serde(rename = "validatorAddresses")]
    pub validator_addresses: Vec<String>,
}

impl GetValidatorStorageLocationsRequest {
    pub fn new(validator_addresses: Vec<String>) -> GetValidatorStorageLocationsRequest {
        GetValidatorStorageLocationsRequest {
            validator_addresses,
        }
    }
}


