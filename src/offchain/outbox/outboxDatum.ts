import * as helios from "@hyperionbt/helios";
import type { HeliosMerkleTree } from "../merkle/helios.merkle";
import { deserializeMerkleTree, serializeMerkleTree } from "./outboxMerkle";
import { type Message, serializeMessage } from "../message";

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

export function deserializeOutboxDatum(utxoOutbox: helios.TxInput): {
  merkleTree: HeliosMerkleTree;
} {
  if (utxoOutbox.origOutput.datum?.data == null) {
    throw new Error("Missing datum");
  }
  return {
    merkleTree: deserializeMerkleTree(
      JSON.parse(utxoOutbox.origOutput.datum.data.toSchemaJson()).list[0].list
    ),
  };
}
