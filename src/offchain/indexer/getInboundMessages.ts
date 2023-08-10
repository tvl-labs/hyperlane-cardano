import * as helios from "@hyperionbt/helios";
import fetch from "node-fetch";
import MintingPolicyIsmMultiSig from "../../onchain/ismMultiSig.hl";
import type { IsmParamsHelios } from "../inbox/ismParams";
import { blockfrostPrefix, blockfrostProjectId } from "./blockfrost";

// TODO: Walk down the tx history as messages will be consumed for usage like USDC
export async function getInboundMessages(
  ismParams: IsmParamsHelios
): Promise<helios.ByteArray[]> {
  const mphISM = new MintingPolicyIsmMultiSig(ismParams).compile(true)
    .mintingPolicyHash.hex;

  const messages: helios.ByteArray[] = [];

  for (let page = 1; true; page++) {
    const utxos: any = await fetch(
      `${blockfrostPrefix}/addresses/${ismParams.RECIPIENT_ADDRESS.toBech32()}/utxos/?page=${page}`,
      {
        headers: {
          project_id: blockfrostProjectId,
        },
      }
    ).then(async (r) => await r.json());

    if (!Array.isArray(utxos) || utxos.length === 0) break;

    for (const utxo of utxos) {
      if (utxo.amount.find((a) => a.unit.substring(0, 56) === mphISM) == null) {
        continue;
      }
      try {
        messages.push(
          new helios.ByteArray(
            helios.ListData.fromCbor(
              helios.hexToBytes(utxo.inline_datum)
            ).list[6].bytes
          )
        );
      } catch (e) {
        console.warn(e);
      }
    }
  }

  return messages;
}
