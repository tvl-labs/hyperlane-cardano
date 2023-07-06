import { type OutboxMessage } from "../../offchain/outbox/outboxMessage";

/**
 * The protocol sets up 'version', 'originDomain' and 'nonce' fields.
 * Nonce is calculated on-chain as the MerkleTree's size.
 * Origin domain is set from the on-chain contract.
 * Version is a constant representing the binary encoding version, currently equal to 0.
 */
export type OutboxDispatchedMessage = Omit<
OutboxMessage,
"version" | "originDomain" | "nonce"
>;
