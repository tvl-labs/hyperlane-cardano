import * as helios from "@hyperionbt/helios";
import fetch from "node-fetch";
import MintingPolicyIsmMultiSig from "../../onchain/ismMultiSig.hl";
import ScriptInbox from "../../onchain/scriptInbox.hl";
import type { IsmParamsHelios } from "../inbox/ismParams";
import { blockfrostPrefix, blockfrostProjectId } from "./blockfrost";
import { parseBlockfrostUtxos } from "./parseBlockfrostUtxos";

export async function getInboxUTxO(
  ismParams: IsmParamsHelios
): Promise<helios.UTxO | null> {
  const addressInbox = helios.Address.fromValidatorHash(
    new ScriptInbox().compile(true).validatorHash
  );
  const mphISM = new MintingPolicyIsmMultiSig(ismParams).compile(true)
    .mintingPolicyHash.hex;

  const utxos: any = await fetch(
    `${blockfrostPrefix}/addresses/${addressInbox.toBech32()}/utxos/${mphISM}61757468`,
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
