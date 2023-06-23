import * as helios from "@hyperionbt/helios";
import fetch from "node-fetch";
import ScriptOutbox from "../../onchain/scriptOutbox.hl";
import { BLOCKFROST_PREFIX } from "../common";

// Note: we can provide another interface that takes in a
// trusted/cached minting policy hash instead of recompiling here.
export async function getOutboundMessages(): Promise<helios.ByteArray[]> {
  const addressOutbox = helios.Address.fromValidatorHash(
    new ScriptOutbox().compile(true).validatorHash
  );

  const utxos: any = await fetch(
    `${BLOCKFROST_PREFIX}/addresses/${addressOutbox.toBech32()}/utxos`,
    {
      headers: {
        project_id: process.env.BLOCKFROST_PROJECT_ID,
      },
    }
  ).then((r) => r.json());

  return utxos.flatMap((utxo) => {
    try {
      const text = new helios.ByteArray(
        helios.ListData.fromCbor(
          helios.hexToBytes(utxo.inline_datum)
        ).list[1].bytes
      );
      return text.bytes.length ? [text] : [];
    } catch (_) {
      return [];
    }
  });
}