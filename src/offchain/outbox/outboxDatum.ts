import * as helios from "@hyperionbt/helios";
import type { HeliosMerkleTree } from "../../merkle/helios.merkle";
import { deserializeMerkleTree, serializeMerkleTree } from "./outboxMerkle";
import type { Message } from "../message";
import { serializeMessage } from "../messageSerialize";

export function serializeOutboxDatum(
  merkleTree: HeliosMerkleTree,
  outboxMessage?: Message
) {
  const datum: any = [serializeMerkleTree(merkleTree)];
  if (outboxMessage != null) {
    datum.push(new helios.ConstrData(0, [serializeMessage(outboxMessage)]));
  }
  return new helios.ListData(datum);
}

export function deserializeOutboxDatum(utxoOutbox: helios.UTxO): {
  merkleTree: HeliosMerkleTree;
} {
  const datumOutbox = utxoOutbox.origOutput.datum.data;
  const datumMerkleTree = datumOutbox.list[0];
  const merkleTree = deserializeMerkleTree(datumMerkleTree);
  return { merkleTree };
}
