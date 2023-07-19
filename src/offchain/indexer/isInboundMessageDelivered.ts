import * as helios from "@hyperionbt/helios";
import fetch from "node-fetch";
import MintingPolicyIsmMultiSig from "../../onchain/ismMultiSig.hl";
import { TOKEN_NAME_AUTH } from "../wallet";
import type { IsmParamsHelios } from "../inbox/ismParams";
import { blockfrostPrefix, blockfrostProjectId } from "./blockfrost";
import type { Message } from "../message";
import { serializeMessage } from "../messageSerialize";

// NOTE: This doesn't scale very well
// NOTE: We must walk down the tx history if we allow dApps
// to consume the messages. A better check is via another
// Merkle Tree for inbound messages.
export async function isInboundMessageDelivered(
  ismParams: IsmParamsHelios,
  message: Message
): Promise<boolean> {
  const authenticMPH = new MintingPolicyIsmMultiSig(ismParams).compile(true)
    .mintingPolicyHash.hex;
  const messageDatum = serializeMessage(message).toCborHex();

  for (let page = 1; true; page++) {
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

    if (utxos.length === 0) break;

    for (const utxo of utxos) {
      if (utxo.inline_datum === messageDatum) {
        return true;
      }
    }
  }

  return false;
}
