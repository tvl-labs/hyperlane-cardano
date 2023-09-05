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
    const addressOutbox = helios.Address.fromValidatorHash(
      getProgramOutbox().validatorHash
    );
    const messages: any = [];

    for (let page = 1; true; page++) {
      const txs: any = await fetch(
        `${blockfrostPrefix}/addresses/${addressOutbox.toBech32()}/transactions?from=${fromBlock}&to=${toBlock}&page=${page}`,
        {
          headers: {
            project_id: blockfrostProjectId,
          },
        }
      ).then(async (r) => await r.json());

      if (txs.length === 0) break;

      for (const tx of txs) {
        try {
          const txUTxOs: any = await fetch(
            `${blockfrostPrefix}/txs/${tx.tx_hash as string}/utxos`,
            {
              headers: {
                project_id: blockfrostProjectId,
              },
            }
          ).then(async (r) => await r.json());

          const outbox = txUTxOs.outputs.find(
            (o) =>
              o.address === addressOutbox.toBech32() &&
              o.amount.find((a) => a.unit === outboxAuthToken)
          );
          if (outbox == null) continue;

          const message = new helios.ListData(
            helios.ListData.fromCbor(
              helios.hexToBytes(outbox.inline_datum)
            ).list[1].fields[0].list
          );
          messages.push({
            block: tx.block_height,
            message: toJsonMessage(deserializeMessage(message)),
          });
        } catch (e) {
          console.warn(e);
        }
      }
    }

    return { messages };
  }
}
