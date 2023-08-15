import * as helios from "@hyperionbt/helios";
import fetch from "node-fetch";
import { blockfrostPrefix, blockfrostProjectId } from "./blockfrost";
import { type ValidatorHash } from '@hyperionbt/helios';
import { parseBlockfrostUtxos } from './parseBlockfrostUtxos';

export async function getUsdcRequestUTxOs(
  khalaniScript: ValidatorHash
): Promise<helios.UTxO[]> {
  const addressKhalaniRecipient = helios.Address.fromValidatorHash(
    khalaniScript
  );

  const utxos: any = await fetch(
    `${blockfrostPrefix}/addresses/${addressKhalaniRecipient.toBech32()}/utxos`,
    {
      headers: {
        project_id: blockfrostProjectId,
      },
    }
  ).then(async (r) => await r.json());

  return await parseBlockfrostUtxos(utxos, addressKhalaniRecipient)
}
