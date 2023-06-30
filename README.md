# Hyperlane <> Cardano

## Set up
```sh
yarn
```

## Test

```sh
yarn test
```

- `.env` provides test data to run the "integration" test on Cardano's preview
  network.

## RPC
```
yarn start-rpc
```

## Overview
See [design.md](docs%2Fdesign.md)

### Onchain

#### ISM Multi-Sig Minting Policy

- Objective:
  - Validate a creating message transaction with a multi-sig ISM.
  - Create an UTxO with the message in the datum and an authentic token in the
    value.
- Parameters:
  - `VK_OWNERS`: The verification keys whose signatures are acknowledged.
  - `NUM_SIGNATURES_REQUIRED`: The number of signatures needed to pass a
    transaction.
  - `ADDR_MESSAGE`: The address the messages are posted to.
- Redeemer:
  - `origin`: The origin domain of the checkpoint.
  - `originMailbox`: The address of the origin mailbox.
  - `checkpointRoot`: The root of the checkpoint.
  - `checkpointIndex`: The index of the checkpoint.
  - `message`: The inbound message.
  - `signatures`: The signatures signed on the message hash.
- Validator:
  - `origin`, `originMailbox`, `checkpointRoot`, and `checkpointIndex` must be
    32 bytes each.
  - Must mint only a single auth token.
  - Must produce a single valid message UTxO, which is the only output that can
    hold an authentic token.
  - The submitted message hash is signed by the required number of "owners".
- Message hash:
  `hash(hash(origin + originMailbox + "HYPERLANE") + checkpointRoot + checkpointIndex + hash(message))`.
- Hash function: `blake2b`. **Ideally**, it should be `keccak256` to be more
  compatible with EVM.
- Signing function: `ecdsa-secp256k1`.
- Source with technical insights: `./src/onchain/ismMultiSig.hl`.

#### Forever-Lock Script

- Objective: Forever lock messages from consumption. The message can still be
  referenced.
- Source: `src/onchain/scriptLockForever.hl`.
- **TODO**: Provide more parametermized standard scripts for dApps to utilize.
  For instance, to enforce that an authentic token is burned when the message is
  consumed.

### Offchain

#### Create-Message Transaction

- Objective: Create an authentic on-chain message.
- Inputs: The relayer's UTxOs to cover fees & collateral.
- Scripts: The ISM Multi-Sig Minting Policy.
- Minting: A single authentic token.
- Outputs:
  - A UTxO at `ADDR_MESSAGE` with `message` in the datum and the new authentic
    token in the value.
  - A change UTxO back to the relayer.

#### Authentic-Message Indexer

- Given a set of parameters that form a dApp mailbox, fetch all messages from in
  it. Simply using Blockfrost at the moment.
- **TODO**: Implement a local indexer indexing a local node.

## Flow

### Create a Message from EVM to Cardano

- A relayer fetches EVM validator signatures offchain.
- It then builds, signs, and submits a create-message transaction on Cardano
  with the signatures.
- It can verify that the message is created on Cardano, via:
  - The message address in the ISM parameter.
  - The authentic token with the compiled minting policy hash of the ISM.
  - The message in the datum.
