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
pub struct GetValidatorStorageLocations200Response {
    #[serde(rename = "validatorStorageLocations")]
    pub validator_storage_locations: Vec<crate::models::GetValidatorStorageLocations200ResponseValidatorStorageLocationsInner>,
}

impl GetValidatorStorageLocations200Response {
    pub fn new(validator_storage_locations: Vec<crate::models::GetValidatorStorageLocations200ResponseValidatorStorageLocationsInner>) -> GetValidatorStorageLocations200Response {
        GetValidatorStorageLocations200Response {
            validator_storage_locations,
        }
    }
}


