import { type Message } from "../../offchain/message";

/**
 * The protocol sets up 'version', 'originDomain' and 'nonce' fields.
 * Nonce is calculated on-chain as the MerkleTree's size.
 * Origin domain is set from the on-chain contract.
 * Version is a constant representing the binary encoding version, currently equal to 0.
 */
export type DispatchedMessage = Omit<
  Message,
  "version" | "originDomain" | "nonce"
>;
