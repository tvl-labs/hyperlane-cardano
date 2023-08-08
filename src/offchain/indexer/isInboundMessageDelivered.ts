import * as helios from "@hyperionbt/helios";
import fetch from "node-fetch";
import MintingPolicyIsmMultiSig from "../../onchain/ismMultiSig.hl";
import { TOKEN_NAME_AUTH } from "../wallet";
import type { IsmParamsHelios } from "../inbox/ismParams";
import { blockfrostPrefix, blockfrostProjectId } from "./blockfrost";
import { calculateMessageId, deserializeMessage } from "../message";
import type { H256 } from "../../merkle/h256";

// NOTE: This doesn't scale very well
// NOTE: We must walk down the tx history if we allow dApps
// to consume the messages. A better check is via another
// Merkle Tree for inbound messages.
export async function isInboundMessageDelivered(
  ismParams: IsmParamsHelios,
  messageId: H256
): Promise<boolean> {
  const authenticMPH = new MintingPolicyIsmMultiSig(ismParams).compile(true)
    .mintingPolicyHash.hex;

  for (let page = 1; true; page++) {
    try {
      const utxos: any = await fetch(
        `${blockfrostPrefix}/addresses/${ismParams.RECIPIENT_ADDRESS.toBech32()}/utxos/${
          authenticMPH + helios.bytesToHex(TOKEN_NAME_AUTH)
        }?order=desc&page=${page}`,
        {
          headers: {
            project_id: blockfrostProjectId,
          },
        }
      ).then(async (r) => await r.json());

      if (!Array.isArray(utxos) || utxos.length === 0) break;

      for (const utxo of utxos) {
        if (
          calculateMessageId(
            deserializeMessage(
              helios.ListData.fromCbor(helios.hexToBytes(utxo.inline_datum))
            )
          ).hex() === messageId.hex()
        ) {
          return true;
        }
      }
    } catch (e) {
      console.warn(e);
      break;
    }
  }

  return false;
}
