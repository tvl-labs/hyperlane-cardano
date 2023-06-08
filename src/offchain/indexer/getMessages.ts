import * as helios from "@hyperionbt/helios";
import fetch from "node-fetch";
import MintingPolicyIsmMultiSig from "../../onchain/ismMultiSig.hl";
import { TOKEN_NAME_AUTH, BLOCKFROST_PREFIX } from "../common";
import { AppParams } from "../../typing";

// Note: we can provide another interface that takes in a
// trusted/cached minting policy hash instead of recompiling here.
export async function getMessages(
  appParams: AppParams
): Promise<helios.ByteArray[]> {
  const authenticMPH = new MintingPolicyIsmMultiSig(appParams).compile(true)
    .mintingPolicyHash.hex;

  const utxos: any = await fetch(
    `${BLOCKFROST_PREFIX}/addresses/${appParams.ADDR_MESSAGE.toBech32()}/utxos/${
      authenticMPH + helios.bytesToHex(TOKEN_NAME_AUTH)
    }`,
    {
      headers: {
        project_id: process.env.BLOCKFROST_PROJECT_ID,
      },
    }
  ).then((r) => r.json());

  return utxos.map((utxo) =>
    helios.ByteArray.fromUplcCbor(helios.hexToBytes(utxo.inline_datum))
  );
}
