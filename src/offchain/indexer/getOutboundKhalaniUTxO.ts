import * as helios from "@hyperionbt/helios";
import { getProgramKhalani } from "../../onchain/programs";
import fetch from "node-fetch";
import {
  blockfrostPrefix,
  blockfrostProjectId,
} from "../blockfrost/blockfrost";
import { parseBlockfrostUtxo } from "./parseBlockfrostUtxos";

// TODO: Share with `createOutbox`
const EXPECTED_DATUM = helios.Datum.hashed(new helios.ConstrData(0, []));

// Return the oldest Khalani UTxO without an inline datum for outbound messages.
export async function getOutboundKhalaniUTxO(): Promise<helios.UTxO> {
  const addressKhalani = helios.Address.fromValidatorHash(
    getProgramKhalani().validatorHash
  ).toBech32();

  for (let page = 1; true; page++) {
    const utxos: any = await fetch(
      `${blockfrostPrefix}/addresses/${addressKhalani}/utxos?page=${page}`,
      {
        headers: {
          project_id: blockfrostProjectId,
        },
      }
    ).then(async (r) => await r.json());
    if (!Array.isArray(utxos) || utxos.length === 0) {
      break;
    }

    for (const utxo of utxos) {
      if (
        utxo.inline_datum == null &&
        utxo.data_hash === EXPECTED_DATUM.hash.hex
      ) {
        const utxoWithDatum = parseBlockfrostUtxo(utxo);
        utxoWithDatum.origOutput.setDatum(
          helios.Datum.hashed(new helios.ConstrData(0, []))
        );
        return utxoWithDatum;
      }
    }
  }

  throw new Error("No outbound Khalani UTxO found");
}
