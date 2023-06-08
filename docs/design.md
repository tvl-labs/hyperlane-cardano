## [Hyperlane](https://hyperlane.xyz/) x [Cardano](https://cardano.org/) integration

### Overview
Hyperlane is a permissionless interoperability layer that allows smart contracts to communicate arbitrary data between blockchains.
Currently, Hyperlane natively supports all EVM-compatible chains, and the team is working hard to support Sealevel (Solana) and Fuel blockchains.
This document outlines a proposed design for integration with Cardano.

In the Cardano, the latest state is stored in `Datum` of Unspent Transaction Outputs (UTXOs). UTXOs can be spent by addresses building _valid_ transactions. These addresses can either be a standard private-key wallet or a _validator script_. A validator script is a predicate that validates a transaction and only returns `true` if the inputs/outputs are properly constructed by the off-chain transaction builder. 

Redeemer serves as an additional input to the predicate. All input EUTxOs are _spent_ in this transaction and cannot be spent again.

```
Redeemer = <validator specific input>

Transaction { 
  input_utxos: EUTxO[], 
  redeemer: Redeemer, 
  output_utxos: EUTxO 
}

validate(transaction: Transaction) -> true | false

EUTxO {
    // Hash of the transaction in which this EUTxO was produced 
    txHash
    // Index of EUTxO inside the producing transaction
    txIndex
    // Tokens minted in this transaction
    tokens
    // Payload attached to the EUTxO
    datum: Datum = <arbitrary data>
}
```

### Design [overview](https://www.figma.com/file/0N905WOhyF7HZkbLzWhgyH/Khalani-%2F-Hyperlane?type=whiteboard&node-id=1069-2246&t=UFrhL33SXJpXFuxz-0)

![Khalani _ Hyperlane.png](design.png)

Cardano's integration with Hyperlane consists of `Inbox` and `Outbox` (Mailbox): 
- Inbox — to receive and validate messages from other chains (we call them EVM-compatible, but they can be any)
- Outbox — to dispatch messages from Cardano to other chains

> Note: we analyzed Mailbox [Solidity implementation](https://github.com/hyperlane-xyz/hyperlane-monorepo/blob/55f40ad7602e616367b2483b5ce57eaf7db5420d/solidity/contracts/Mailbox.sol#L18) 
> and found out that `process` and `dispatch` do not share a common state, therefore, they can be separated:
> - `process` maintains a `mapping(bytes32 => bool) delivered` map to deduplicate delivered messages. 
> In Cardano, this is implemented by checking the existence (or the spending) of a corresponding "process"-ed EUTxO.
> - `dispatch` maintains a Merkle Tree to sign message checkpoints. Cardano stores MT in EUTxOs (see below).

### Outbox (Cardano -> EVM chains)
The Outbox constructs an on-chain proof of messages by incorporating them into an incremental (compressed) Merkle Tree (MT).

At any point, there is only one `Outbox EUTxO` containing the most recent MerkleTree and message. When a DApp (user) wants to dispatch a message, they build a transaction that consumes the `Outbox EUTxO` and produces a new `Outbox EUTxO` with the updated MerkleTree and latest message.

The `Outbox Mailbox (Validator Script)` on-chain script validates the MerkleTree transition 
(by ingesting the message leaf to MerkleTree on-chain).

Pseudocode of building a dispatch transaction by a DApp:
```
dispatch(message*) {
  input = wallet.utxo       // to pay fee
  input.utxo = last_utxo()  // from indexer 
  merkleTree* = input.utxo.merkleTree.ingest(message*) 
  output.utxo = {
    address: outbox_validator,
    merkleTree*,
    message*
  }
}
```

### Outbox Indexer
This off-chain component indexes the consumption/production of `Outbox EUTxO`s
and provides an API to query the `Outbox` state at specific previous blocks.

Hyperlane relayer works ("indexes") on top of the "Outbox Indexer" and relays the dispatches messages when they achieve consensus.

> Note: the Hyperlane integration with Ethereum (and Solana) implements indexing using commonly known RPC providers API (`eth_getLogs` etc).
> Because of the EUTxO model, the Cardano node does not provide a similar API, and we need to build a custom indexer,
> using a solution like [Ogmios](https://ogmios.dev/) or [Oura](https://github.com/txpipe/oura).
> Cardano tooling is mostly non-Rust, so we'll run them close to the Hyperlane agents.

The indexer (RPC) API for the Hyperlane relayer should minimally implement the following interface.
```
// Returns the latest finalized Cardano block
last_finalized_block_number() -> number

// Returns the MerkleTree at blockNumber 
tree(blockNumber) -> MerkleTree

// Get messages fromBlock to toBlock
messages(fromBlock, toBlock): [IndexedMessage]
```

> Note (implementation): Hyperlane agent codebase defines [count()](https://github.com/hyperlane-xyz/hyperlane-monorepo/blob/50f04db1faddb6d471b85386bb977fe9762753df/rust/hyperlane-core/src/traits/mailbox.rs#L32) and [latest_checkpoint()](https://github.com/hyperlane-xyz/hyperlane-monorepo/blob/50f04db1faddb6d471b85386bb977fe9762753df/rust/hyperlane-core/src/traits/mailbox.rs#L41) functions of `Mailbox` interace, but they can be trivially implemented via `tree().count()` or `tree().root()`

### Inbox (EVM -> Cardano): MultisigIsm minting policy
Minting policy in Cardano is a subset of "validator scripts" that determines the rules for minting/burning of tokens.
The minting policy is a predicate returning `true | false` to allow a transaction mint tokens and attach them to output EUTxO.

We leverage a minting policy for the `MultisigIsm` implementation: if N/M provided signatures are valid,
a custom 1 "auth" token is minted and attached to the "message" EUTxO, proving the authenticity of the message.
That EUTxO is posted to a predefined DApp's `RECIPIENT_ADDR` (most likely a validator script)
that can "spend" the authenticated message with a DApp-specific processing logic. 

To deliver a message sent from an EVM chain, the relayer builds a transaction:
- the only input UTXO of the transaction is the relayer's wallet to pay for the delivery fee
- the _minting script hash_ of the transaction is `hash(MultisigIsm minting policy)`
- the transaction attaches the MultisigIsm minting policy compiled Plutus code (this is how smart contracts work on Cardano)
- the `RedeemerMultisigIsm` of the `MultisigIsm` minting policy contains N/M validators' signatures, and message metadata to calculate a _digest_ of the signatures 
- the transaction mints 1 "auth" token and attaches it to the only output EUTxO — this is validated by the minting policy
- the transaction sets `Datum = message` to the only output EUTxO
- the output EUTxO is posted to the `RECIPIENT_ADDR` for later processing by a DApp

The `MultisigIsm` minting policy is parameterized by:
- `VK_OWNERS: Pubkey[]` — public keys of the expected validators
- `THRESHOLD` — the validators' quorum threshold
- `RECIPIENT_ADDRESS` — the recipient of output (message) EUTxO

> Note: for each validators/threshold configuration there will be a dedicated minting policy deployed by DApps.

### Challenge: Cardano does not support `keccak256` (but supports `ECDSA.recover`) 
The Cardano team has supported the ECDSA to allow for the EVM-compatibility, but without `keccak256` many use cases are still impossible.
We're going to file a `keccak256` support [CIP](https://github.com/cardano-foundation/CIPs).
> Note: `keccak256` is already available in the Cardano [codebase](https://github.com/input-output-hk/cardano-base/blob/master/cardano-crypto-class/src/Cardano/Crypto/Hash/Keccak256.hs)
>, so there is a good chance it will be included in a future hard-fork.

Hyperlane extensively depends on the `keccak256`:
- `MerkleTree` implementation uses `keccak256` both [on-chain](https://github.com/hyperlane-xyz/hyperlane-monorepo/blob/50f04db1faddb6d471b85386bb977fe9762753df/solidity/contracts/libs/Merkle.sol#L39) and [off-chain](https://github.com/hyperlane-xyz/hyperlane-monorepo/blob/e5e794eda42d906563a4929a4c39bbf2c6993ba3/rust/hyperlane-core/src/accumulator/mod.rs#L20)
- validator agent [uses](https://github.com/hyperlane-xyz/hyperlane-monorepo/blob/d57ae5f628bcf3bc0ebcac2c832ad2821a4a5cbb/rust/agents/validator/src/validator.rs#L63) ETH-specific (EIP-155) [keccak256](https://github.com/hyperlane-xyz/ethers-rs/blob/fe5d88220fc15d99ed19ae20e80ef7985673fa9a/ethers-core/src/utils/hash.rs#LL21C13-L21C13) hashing

### Solution: use `blake2b` instead of `keccak256`
As a workaround, Cardano's on-chain MerkleTree can use `blake2b` for leaf ingestion and root calculation.


#### Flow `Cardano -> EVM`
The Cardano validator needs to validate the MerkleTree using `blake2b`.

On EVM side, there are two options:
- Have the Cardano validator sign the checkpoint using EVM's `keccak256` and use [MessageIdMultisigIsm]([MessageIdMultisigIsm](https://github.com/hyperlane-xyz/hyperlane-monorepo/blob/50f04db1faddb6d471b85386bb977fe9762753df/solidity/contracts/isms/multisig/AbstractMessageIdMultisigIsm.sol#L16)), which doesn't validate the MerkleTree root.
- Implement a Solidity `Blake2bMultisigIsm` for messages originating from Cardano.

#### Flow `EVM -> Cardano`
Cardano `MultisigIsm` cannot recover the signatures signed by EVM-only validators, because the digest of the signatures [depends](https://github.com/hyperlane-xyz/hyperlane-monorepo/blob/50f04db1faddb6d471b85386bb977fe9762753df/rust/hyperlane-core/src/types/checkpoint.rs#L39) on `keccak256`.

The solution is to make the validator sign a digest using `blake2b` and [save](https://github.com/hyperlane-xyz/hyperlane-monorepo/blob/50f04db1faddb6d471b85386bb977fe9762753df/rust/hyperlane-base/src/types/s3_storage.rs#L127) blake2b checkpoints to S3: `checkpoint_blake2b_{index}.json`.

### Status
- We've implemented a simple `MultisigIsm` minting policy and Typescript SDK to disptach messages.
- We started [cardano](https://github.com/tvl-labs/hyperlane-monorepo/tree/cardano) Git branch in our `hyperlane-monorepo` fork based off Sealevel's feature branch.
- We're going to implement `Outbox` and a TypeScript SDK to `dispatch` messages.