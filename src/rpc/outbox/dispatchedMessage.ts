import { type Message } from "../../offchain/message";

/**
 * The protocol sets up 'version', 'originDomain', 'sender' and 'nonce' fields.
 * Nonce is calculated on-chain as the MerkleTree's size.
 * Origin domain is set from the on-chain contract.
 * Sender is set from the wallet sending the transaction.
 * Version is a constant representing the binary encoding version, currently equal to 0.
 */
export type DispatchedMessage = Omit<
  Message,
  "version" | "sender" | "originDomain" | "nonce"
>;
