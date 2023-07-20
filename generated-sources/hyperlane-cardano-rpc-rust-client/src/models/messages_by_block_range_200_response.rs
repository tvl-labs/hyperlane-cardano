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
pub struct MessagesByBlockRange200Response {
    #[serde(rename = "messages")]
    pub messages: Vec<crate::models::MessagesByBlockRange200ResponseMessagesInner>,
}

impl MessagesByBlockRange200Response {
    pub fn new(messages: Vec<crate::models::MessagesByBlockRange200ResponseMessagesInner>) -> MessagesByBlockRange200Response {
        MessagesByBlockRange200Response {
            messages,
        }
    }
}


