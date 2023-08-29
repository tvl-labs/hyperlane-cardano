import * as helios from "@hyperionbt/helios";
import fetch from "node-fetch";
import { blockfrostPrefix, blockfrostProjectId } from "./blockfrost";
import { parseBlockfrostUtxos } from "./parseBlockfrostUtxos";
import { type Address } from '../address';

export async function getUsdcRequestUTxOs(
  khalaniScriptAddress: Address
): Promise<helios.UTxO[]> {
  const addressKhalaniRecipient =
    helios.Address.fromValidatorHash(khalaniScriptAddress.toValidatorHash());

  const utxos: any = await fetch(
    `${blockfrostPrefix}/addresses/${addressKhalaniRecipient.toBech32()}/utxos`,
    {
      headers: {
        project_id: blockfrostProjectId,
      },
    }
  ).then(async (r) => await r.json());

  return await parseBlockfrostUtxos(utxos, addressKhalaniRecipient);
}
