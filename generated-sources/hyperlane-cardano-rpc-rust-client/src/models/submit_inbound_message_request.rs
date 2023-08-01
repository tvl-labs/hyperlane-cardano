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
pub struct SubmitInboundMessageRequest {
    #[serde(rename = "relayerCardanoAddress")]
    pub relayer_cardano_address: String,
    #[serde(rename = "privateKey")]
    pub private_key: String,
    #[serde(rename = "origin")]
    pub origin: f32,
    #[serde(rename = "originMailbox")]
    pub origin_mailbox: String,
    #[serde(rename = "checkpointRoot")]
    pub checkpoint_root: String,
    #[serde(rename = "checkpointIndex")]
    pub checkpoint_index: f32,
    #[serde(rename = "message")]
    pub message: Box<crate::models::EstimateInboundMessageFeeRequestMessage>,
    #[serde(rename = "signatures")]
    pub signatures: Vec<String>,
}

impl SubmitInboundMessageRequest {
    pub fn new(relayer_cardano_address: String, private_key: String, origin: f32, origin_mailbox: String, checkpoint_root: String, checkpoint_index: f32, message: crate::models::EstimateInboundMessageFeeRequestMessage, signatures: Vec<String>) -> SubmitInboundMessageRequest {
        SubmitInboundMessageRequest {
            relayer_cardano_address,
            private_key,
            origin,
            origin_mailbox,
            checkpoint_root,
            checkpoint_index,
            message: Box::new(message),
            signatures,
        }
    }
}


