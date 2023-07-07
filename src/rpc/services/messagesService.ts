import * as helios from "@hyperionbt/helios";
import fetch from "node-fetch";
import ScriptOutbox from "../../onchain/scriptOutbox.hl";
import type { MessagesByBlockRangeResponseType } from "../types";

export class MessagesService {
  async getMessagesInBlockRange(
    fromBlock: number,
    toBlock: number
  ): Promise<MessagesByBlockRangeResponseType> {
    const addressOutbox = helios.Address.fromValidatorHash(
      new ScriptOutbox().compile(true).validatorHash
    );

    const messages: any = [];

    for (let page = 1; true; page++) {
      const txs: any = await fetch(
        `${
          process.env.BLOCKFROST_PREFIX ?? ""
        }/addresses/${addressOutbox.toBech32()}/transactions?from=${fromBlock}&to=${toBlock}&page=${page}`,
        {
          headers: {
            project_id: process.env.BLOCKFROST_PROJECT_ID ?? "",
          },
        }
      ).then(async (r) => await r.json());

      if (txs.length === 0) break;

      for (const tx of txs) {
        const txUTxOs: any = await fetch(
          `${process.env.BLOCKFROST_PREFIX ?? ""}/txs/${
            tx.tx_hash as string
          }/utxos`,
          {
            headers: {
              project_id: process.env.BLOCKFROST_PROJECT_ID ?? "",
            },
          }
        ).then(async (r) => await r.json());

        const outbox = txUTxOs.outputs.find(
          (o) =>
            o.address === addressOutbox.toBech32() &&
            o.amount.find((a) => a.unit === process.env.OUTBOX_AUTH_TOKEN)
        );
        if (outbox == null) continue;

        const body = helios.bytesToHex(
          helios.ListData.fromCbor(helios.hexToBytes(outbox.inline_datum))
            .list[1].bytes
        );
        const txRedeemers: any = await fetch(
          `${process.env.BLOCKFROST_PREFIX ?? ""}/txs/${
            tx.tx_hash as string
          }/redeemers`,
          {
            headers: {
              project_id: process.env.BLOCKFROST_PROJECT_ID ?? "",
            },
          }
        ).then(async (r) => await r.json());
        const redeemer: any = txRedeemers.find(
          (r) =>
            r.purpose === "spend" &&
            r.script_hash === addressOutbox.validatorHash.hex
        );
        if (redeemer == null) continue;
        const fullRedeemer: any = await fetch(
          `${process.env.BLOCKFROST_PREFIX ?? ""}/scripts/datum/${
            redeemer.redeemer_data_hash as string
          }`,
          {
            headers: {
              project_id: process.env.BLOCKFROST_PROJECT_ID ?? "",
            },
          }
        ).then(async (r) => await r.json());
        const redeemerValue = fullRedeemer.json_value.list;
        messages.push({
          block: tx.block_height,
          message: {
            version: parseInt(redeemerValue[0].bytes, 16),
            nonce: parseInt(redeemerValue[1].bytes, 16),
            originDomain: parseInt(redeemerValue[2].bytes, 16),
            sender: redeemerValue[3].bytes,
            destinationDomain: parseInt(redeemerValue[4].bytes, 16),
            recipient: redeemerValue[4].bytes,
            body,
          },
        });
      }
    }

    return { messages };
  }
}
