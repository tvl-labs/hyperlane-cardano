import * as helios from "@hyperionbt/helios";
import type { Address } from "./address";
import { type Message, calculateMessageId } from "./message";
import { H256 } from "./h256";
import { bufferToHeliosByteArray } from "./outbox/heliosByteArrayUtils";

// Try to follow Hyperlane as much as possible
// https://github.com/hyperlane-xyz/hyperlane-monorepo/blob/main/solidity/contracts/libs/CheckpointLib.sol
export interface Checkpoint {
  // The address of the origin mailbox as bytes32.
  originMailbox: Address;
  // The root of the checkpoint.
  checkpointRoot: H256;
  // The message of the checkpoint.
  message: Message;
}

// TODO: Use more unified data types and conversion code...
export function hashCheckpoint(checkpoint: Checkpoint): H256 {
  const origin = Buffer.alloc(4);
  origin.writeUInt32BE(checkpoint.message.originDomain);
  const checkpointIndex = Buffer.alloc(4);
  checkpointIndex.writeUInt32BE(checkpoint.message.nonce);
  return H256.from(
    Buffer.from(
      helios.Crypto.blake2b(
        helios.Crypto.blake2b([
          ...Buffer.concat([
            origin,
            checkpoint.originMailbox.toBuffer(),
            Buffer.from("HYPERLANE"),
          ]).values(),
        ])
          .concat(checkpoint.checkpointRoot.toByteArray())
          .concat([...checkpointIndex.values()])
          .concat(calculateMessageId(checkpoint.message).toByteArray())
      )
    )
  );
}

export function serializeCheckpoint(
  checkpoint: Checkpoint,
  signatures: Buffer[] // TODO: Define a 64-byte type for signatures
): helios.UplcData[] {
  return [
    bufferToHeliosByteArray(checkpoint.originMailbox.toBuffer()),
    bufferToHeliosByteArray(checkpoint.checkpointRoot.toBuffer()),
    new helios.ListData(
      signatures.map((s) => new helios.ByteArrayData([...s.values()]))
    ),
  ];
}
