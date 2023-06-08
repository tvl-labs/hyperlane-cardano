import * as helios from "@hyperionbt/helios";
import fetch from "node-fetch";
import MintingPolicyIsmMultiSig from "../../onchain/ismMultiSig.hl";
import { TOKEN_NAME_AUTH } from "../common";

// Note: we can provide another interface that takes in a
// trusted/cached minting policy hash instead of recompiling here.
export async function getMessages(
  VK_OWNERS: helios.ByteArray[],
  NUM_SIGNATURES_REQUIRED: bigint,
  ADDR_MESSAGE: helios.Address
): Promise<helios.ByteArray[]> {
  const authenticMPH = new MintingPolicyIsmMultiSig({
    VK_OWNERS,
    NUM_SIGNATURES_REQUIRED,
    ADDR_MESSAGE,
  }).compile(true).mintingPolicyHash.hex;

  const utxos: any = await fetch(
    `https://cardano-preview.blockfrost.io/api/v0/addresses/${ADDR_MESSAGE.toBech32()}/utxos/${
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
