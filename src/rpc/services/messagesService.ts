import * as helios from "@hyperionbt/helios";
import fetch from "node-fetch";
import ScriptOutbox from "../../onchain/scriptOutbox.hl";
import type { MessagesByBlockRangeResponseType } from "../types";
import { type IMessagesService } from "./IMessagesService";

export class MessagesService implements IMessagesService {
  async getMessagesInBlockRange(
    fromBlock: number,
    toBlock: number
  ): Promise<MessagesByBlockRangeResponseType> {
    const addressOutbox = helios.Address.fromValidatorHash(
      new ScriptOutbox().compile(true).validatorHash
    );

    const messages: any = [];

    // TODO: Handle outbox identity
    for (let page = 1; true; page++) {
      const utxos: any = await fetch(
        `${
          process.env.BLOCKFROST_PREFIX ?? ""
        }/addresses/${addressOutbox.toBech32()}/utxos?page=${page}&order=desc`,
        {
          headers: {
            project_id: process.env.BLOCKFROST_PROJECT_ID ?? "",
          },
        }
      ).then(async (r) => await r.json());

      if (utxos.length === 0) break;

      for (const utxo of utxos) {
        const block: any = await fetch(
          `${process.env.BLOCKFROST_PREFIX ?? ""}/blocks/${
            utxo.block as string
          }`,
          {
            headers: {
              project_id: process.env.BLOCKFROST_PROJECT_ID ?? "",
            },
          }
        ).then(async (r) => await r.json());

        if (block.height < fromBlock) break;

        if (block.height <= toBlock) {
          const body = helios.bytesToHex(
            helios.ListData.fromCbor(helios.hexToBytes(utxo.inline_datum))
              .list[1].bytes
          );
          const txRedeemers: any = await fetch(
            `${process.env.BLOCKFROST_PREFIX ?? ""}/txs/${
              utxo.tx_hash as string
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
            block: block.height,
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
    }

    return { messages: messages.reverse() };
  }
}
