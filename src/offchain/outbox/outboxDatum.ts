import * as helios from "@hyperionbt/helios";
import type { HeliosMerkleTree } from "../../merkle/helios.merkle";
import { deserializeMerkleTree, serializeMerkleTree } from "./outboxMerkle";
import { bufferToHeliosByteArray } from "./heliosByteArrayUtils";
import type { Buffer } from "buffer";

export function serializeOutboxDatum(
  merkleTree: HeliosMerkleTree,
  outboxMessage: Buffer
) {
  return new helios.ListData([
    // Merkle tree
    serializeMerkleTree(merkleTree),
    // Latest message
    bufferToHeliosByteArray(outboxMessage)._toUplcData(),
  ]);
}

export function deserializeOutboxDatum(utxoOutbox: helios.UTxO): {
  merkleTree: HeliosMerkleTree;
} {
  const datumOutbox = utxoOutbox.origOutput.datum.data;
  const datumMerkleTree = datumOutbox.list[0];
  const merkleTree = deserializeMerkleTree(datumMerkleTree);
  return { merkleTree };
}
