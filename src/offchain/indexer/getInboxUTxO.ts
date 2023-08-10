import * as helios from "@hyperionbt/helios";
import fetch from "node-fetch";
import MintingPolicyIsmMultiSig from "../../onchain/ismMultiSig.hl";
import ScriptInbox from "../../onchain/scriptInbox.hl";
import type { IsmParamsHelios } from "../inbox/ismParams";
import { blockfrostPrefix, blockfrostProjectId } from "./blockfrost";

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

  if (!Array.isArray(utxos) || utxos.length !== 1) return null;
  const utxo = utxos[0];

  return new helios.UTxO(
    helios.TxId.fromHex(utxo.tx_hash),
    BigInt(utxo.output_index),
    new helios.TxOutput(
      addressInbox,
      helios.BlockfrostV0.parseValue(utxo.amount),
      helios.Datum.inline(
        helios.UplcData.fromCbor(helios.hexToBytes(utxo.inline_datum))
      )
    )
  );
}
