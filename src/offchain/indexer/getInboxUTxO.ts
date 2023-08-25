import * as helios from "@hyperionbt/helios";
import fetch from "node-fetch";
import {
  TOKEN_NAME_AUTH_HEX,
  getProgramInbox,
  getProgramIsmKhalani,
} from "../../onchain/programs";
import type { IsmParamsHelios } from "../inbox/ismParams";
import { blockfrostPrefix, blockfrostProjectId } from "./blockfrost";
import { parseBlockfrostUtxos } from "./parseBlockfrostUtxos";

export async function getInboxUTxO(
  ismParams: IsmParamsHelios
): Promise<helios.UTxO | null> {
  const addressInbox = helios.Address.fromValidatorHash(
    getProgramInbox().validatorHash
  );
  const mphISM = getProgramIsmKhalani(ismParams).mintingPolicyHash.hex;

  const utxos: any = await fetch(
    `${blockfrostPrefix}/addresses/${addressInbox.toBech32()}/utxos/${mphISM}${TOKEN_NAME_AUTH_HEX}`,
    {
      headers: {
        project_id: blockfrostProjectId,
      },
    }
  ).then(async (r) => await r.json());

  if (!Array.isArray(utxos)) return null;
  const parsedUtxos = await parseBlockfrostUtxos(utxos, addressInbox);
  if (parsedUtxos.length !== 1) {
    throw new Error(`Expected 1 UTXO but found ${parsedUtxos.length}`);
  }
  return parsedUtxos[0];
}
