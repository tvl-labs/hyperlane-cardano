import * as helios from "@hyperionbt/helios";
import fetch from "node-fetch";
import { blockfrostPrefix, blockfrostProjectId } from "./blockfrost";
import { getProgramOutbox } from "../../onchain/programs";

// Note: we can provide another interface that takes in a
// trusted/cached minting policy hash instead of recompiling here.
// Note: This only gets the latest message of each outbox
export async function getOutboundMessages(): Promise<helios.ByteArray[]> {
  const addressOutbox = helios.Address.fromValidatorHash(
    getProgramOutbox().validatorHash
  );

  const messages: helios.ByteArray[] = [];

  for (let page = 1; true; page++) {
    const utxos: any = await fetch(
      `${blockfrostPrefix}/addresses/${addressOutbox.toBech32()}/utxos?page=${page}`,
      {
        headers: {
          project_id: blockfrostProjectId,
        },
      }
    ).then(async (r) => await r.json());

    if (!Array.isArray(utxos) || utxos.length === 0) break;

    for (const utxo of utxos) {
      try {
        const message = new helios.ByteArray(
          helios.ListData.fromCbor(
            helios.hexToBytes(utxo.inline_datum)
          ).list[1].fields[0].list[6].bytes
        );
        if (message.bytes.length > 0) {
          messages.push(message);
        }
      } catch (_) {}
    }
  }

  return messages;
}
