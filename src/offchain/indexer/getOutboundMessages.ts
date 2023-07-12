import * as helios from "@hyperionbt/helios";
import fetch from "node-fetch";
import ScriptOutbox from "../../onchain/scriptOutbox.hl";
import { blockfrostPrefix, blockfrostProjectId } from "./blockfrost";

// Note: we can provide another interface that takes in a
// trusted/cached minting policy hash instead of recompiling here.
// Note: This only gets the latest message of each outbox
export async function getOutboundMessages(): Promise<helios.ByteArray[]> {
  const addressOutbox = helios.Address.fromValidatorHash(
    new ScriptOutbox().compile(true).validatorHash
  );

  const utxos: any = await fetch(
    `${blockfrostPrefix}/addresses/${addressOutbox.toBech32()}/utxos`,
    {
      headers: {
        project_id: blockfrostProjectId,
      },
    }
  ).then(async (r) => await r.json());

  return utxos.flatMap((utxo) => {
    try {
      const text = new helios.ByteArray(
        helios.ListData.fromCbor(
          helios.hexToBytes(utxo.inline_datum)
        ).list[1].fields[0].list[6].bytes
      );
      return text.bytes.length > 0 ? [text] : [];
    } catch (_) {
      return [];
    }
  });
}
