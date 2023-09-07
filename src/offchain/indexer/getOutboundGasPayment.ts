import type * as helios from "@hyperionbt/helios";
import fetch from "node-fetch";
import {
  blockfrostPrefix,
  blockfrostProjectId,
} from "../blockfrost/blockfrost";

// This will scale VERY poorly, and benefit a ton from
// custom caching/indexing.
export async function getOutboundGasPayment(
  relayerAddress: helios.Address,
  messageId: helios.ByteArrayData
): Promise<bigint> {
  const messageIdDatum = messageId.toCborHex();
  let total = BigInt(0);
  for (let page = 1; true; page++) {
    const txs: any = await fetch(
      `${blockfrostPrefix}/addresses/${relayerAddress.toBech32()}/transactions?page=${page}`,
      {
        headers: {
          project_id: blockfrostProjectId,
        },
      }
    ).then(async (r) => await r.json());

    if (!Array.isArray(txs) || txs.length === 0) break;

    for (const tx of txs) {
      const txUTxOs: any = await fetch(
        `${blockfrostPrefix}/txs/${tx.tx_hash as string}/utxos`,
        {
          headers: {
            project_id: blockfrostProjectId,
          },
        }
      ).then(async (r) => await r.json());

      for (const output of txUTxOs.outputs) {
        if (output.inline_datum === messageIdDatum) {
          total += BigInt(
            output.amount.find((a) => a.unit === "lovelace").quantity
          );
        }
      }
    }
  }
  return total;
}
