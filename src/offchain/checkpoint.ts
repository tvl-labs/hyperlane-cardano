import * as helios from "@hyperionbt/helios";
import type { Address } from "./address";
import { type Message, calculateMessageId } from "./message";

// Try to follow Hyperlane as much as possible
// https://github.com/hyperlane-xyz/hyperlane-monorepo/blob/main/solidity/contracts/libs/CheckpointLib.sol
export interface Checkpoint {
  // The origin domain of the checkpoint.
  origin: number;
  // The address of the origin mailbox as bytes32.
  originMailbox: Address;
  // The root of the checkpoint.
  checkpointRoot: Buffer; // 32 bytes
  // The index of the checkpoint.
  checkpointIndex: number;
  // The message of the checkpoint.
  message: Message;
}

// TODO: Use more unified data types and conversion code...
export function hashCheckpoint(checkpoint: Checkpoint): Buffer {
  const origin = Buffer.alloc(4);
  origin.writeUInt32BE(checkpoint.origin);
  const checkpointIndex = Buffer.alloc(4);
  checkpointIndex.writeUInt32BE(checkpoint.checkpointIndex);
  return Buffer.from(
    helios.Crypto.blake2b(
      helios.Crypto.blake2b([
        ...Buffer.concat([
          origin,
          checkpoint.originMailbox.toBuffer(),
          Buffer.from("HYPERLANE"),
        ]).values(),
      ])
        .concat([...checkpoint.checkpointRoot.values()])
        .concat([...checkpointIndex.values()])
        .concat(calculateMessageId(checkpoint.message).toByteArray())
    )
  );
}
