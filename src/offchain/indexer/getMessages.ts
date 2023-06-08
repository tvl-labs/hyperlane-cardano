import * as helios from "@hyperionbt/helios";
import fetch from "node-fetch";
import MintingPolicyIsmMultiSig from "../../onchain/ismMultiSig.hl";
import { TOKEN_NAME_AUTH } from "../common";
import { AppParams } from "../../typing";

// Note: we can provide another interface that takes in a
// trusted/cached minting policy hash instead of recompiling here.
export async function getMessages(
  appParams: AppParams
): Promise<helios.ByteArray[]> {
  const authenticMPH = new MintingPolicyIsmMultiSig(appParams).compile(true)
    .mintingPolicyHash.hex;

  const utxos: any = await fetch(
    `https://cardano-preview.blockfrost.io/api/v0/addresses/${appParams.ADDR_MESSAGE.toBech32()}/utxos/${
      authenticMPH + helios.bytesToHex(TOKEN_NAME_AUTH)
    }`,
    {
      headers: {
        project_id: "previewYsVVUeDDNVGdZ86B5olBg5OYEyl6Zmjy",
      },
    }
  ).then((r) => r.json());

  return utxos.map((utxo) =>
    helios.ByteArray.fromUplcCbor(helios.hexToBytes(utxo.inline_datum))
  );
}
