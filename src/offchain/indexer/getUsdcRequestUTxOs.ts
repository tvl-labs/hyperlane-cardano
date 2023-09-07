import * as helios from "@hyperionbt/helios";
import fetch from "node-fetch";
import {
  blockfrostPrefix,
  blockfrostProjectId,
} from "../blockfrost/blockfrost";
import { parseBlockfrostUtxos } from "./parseBlockfrostUtxos";
import { type Address } from "../address";

export async function getUsdcRequestUTxOs(
  khalaniScriptAddress: Address
): Promise<helios.TxInput[]> {
  const addressKhalaniRecipient = helios.Address.fromHash(
    khalaniScriptAddress.toValidatorHash()
  ).toBech32();

  const utxos: any = await fetch(
    `${blockfrostPrefix}/addresses/${addressKhalaniRecipient}/utxos`,
    {
      headers: {
        project_id: blockfrostProjectId,
      },
    }
  ).then(async (r) => await r.json());

  return parseBlockfrostUtxos(utxos);
}
