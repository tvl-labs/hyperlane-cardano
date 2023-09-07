import * as helios from "@hyperionbt/helios";
import fetch from "node-fetch";
import {
  TOKEN_NAME_AUTH_HEX,
  getProgramInbox,
  getProgramIsmKhalani,
} from "../../onchain/programs";
import type { IsmParamsHelios } from "../inbox/ismParams";
import {
  blockfrostPrefix,
  blockfrostProjectId,
} from "../blockfrost/blockfrost";
import { parseBlockfrostUtxo } from "./parseBlockfrostUtxos";

export async function getInboxUTxO(
  ismParams: IsmParamsHelios
): Promise<helios.TxInput | null> {
  const addressInbox = helios.Address.fromHash(
    getProgramInbox().validatorHash
  ).toBech32();
  const mphISM = getProgramIsmKhalani(ismParams).mintingPolicyHash.hex;

  const utxos: any = await fetch(
    `${blockfrostPrefix}/addresses/${addressInbox}/utxos/${mphISM}${TOKEN_NAME_AUTH_HEX}`,
    {
      headers: {
        project_id: blockfrostProjectId,
      },
    }
  ).then(async (r) => await r.json());

  if (!Array.isArray(utxos)) return null;
  if (utxos.length !== 1) {
    throw new Error(`Expected 1 UTXO but found ${utxos.length}`);
  }
  return parseBlockfrostUtxo(utxos[0]);
}
