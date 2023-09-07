import * as helios from "@hyperionbt/helios";
import fetch from "node-fetch";
import { getProgramOutbox } from "../../onchain/programs";
import type { MessagesByBlockRangeResponseType } from "../types";
import { type IMessagesService } from "./interfaces/IMessagesService";
import {
  blockfrostPrefix,
  blockfrostProjectId,
} from "../../offchain/blockfrost/blockfrost";
import { deserializeMessage, toJsonMessage } from "../../offchain/message";
import { getOutboxParams } from "../../offchain/outbox/outboxParams";

export class MessagesService implements IMessagesService {
  async getMessagesInBlockRange(
    fromBlock: number,
    toBlock: number
  ): Promise<MessagesByBlockRangeResponseType> {
    const { outboxAuthToken } = getOutboxParams();
    const addressOutbox = helios.Address.fromHash(
      getProgramOutbox().validatorHash
    ).toBech32();
    const messages: any = [];

    for (let page = 1; true; page++) {
      const txs: any = await fetch(
        `${blockfrostPrefix}/addresses/${addressOutbox}/transactions?from=${fromBlock}&to=${toBlock}&page=${page}`,
        {
          headers: {
            project_id: blockfrostProjectId,
          },
        }
      ).then(async (r) => await r.json());

      if (!Array.isArray(txs) || txs.length === 0) break;

      for (const tx of txs) {
        const txHash = tx.tx_hash as string;
        try {
          const txUTxOs: any = await fetch(
            `${blockfrostPrefix}/txs/${txHash}/utxos`,
            {
              headers: {
                project_id: blockfrostProjectId,
              },
            }
          ).then(async (r) => await r.json());

          const outbox = txUTxOs.outputs.find(
            (o) =>
              o.address === addressOutbox &&
              o.amount.find((a) => a.unit === outboxAuthToken)
          );
          if (outbox == null) continue;

          const datum = JSON.parse(
            helios.ListData.fromCbor(
              helios.hexToBytes(outbox.inline_datum)
            ).toSchemaJson()
          ).list;

          if (datum.length < 2) {
            // Empty Outbox has no message.
            //  TODO: reuse the UTXO parser functions.
            continue;
          }

          messages.push({
            block: tx.block_height,
            message: toJsonMessage(deserializeMessage(datum[1].fields[0].list)),
          });
        } catch (e) {
          console.warn(`Unable to parse tx ${txHash}`, e);
        }
      }
    }

    return { messages };
  }
}
