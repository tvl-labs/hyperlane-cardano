import * as helios from "@hyperionbt/helios";
import fetch from "node-fetch";
import MintingPolicyIsmMultiSig from "../../onchain/ismMultiSig.hl";
import { TOKEN_NAME_AUTH, BLOCKFROST_PREFIX } from "../wallet";
import type { AppParams } from "../../typing";

// Note: we can provide another interface that takes in a
// trusted/cached minting policy hash instead of recompiling here.
export async function getInboundMessages(
  appParams: AppParams
): Promise<helios.ByteArray[]> {
  const authenticMPH = new MintingPolicyIsmMultiSig(appParams).compile(true)
    .mintingPolicyHash.hex;

  const messages: helios.ByteArray[] = [];

  for (let page = 1; true; page++) {
    const utxos: any = await fetch(
      `${BLOCKFROST_PREFIX}/addresses/${appParams.ADDR_MESSAGE.toBech32()}/utxos/${
        authenticMPH + helios.bytesToHex(TOKEN_NAME_AUTH)
      }?page=${page}`,
      {
        headers: {
          project_id: process.env.BLOCKFROST_PROJECT_ID ?? "",
        },
      }
    ).then(async (r) => await r.json());

    if (utxos.length === 0) break;

    for (const utxo of utxos) {
      messages.push(
        helios.ByteArray.fromUplcCbor(helios.hexToBytes(utxo.inline_datum))
      );
    }
  }

  return messages;
}
