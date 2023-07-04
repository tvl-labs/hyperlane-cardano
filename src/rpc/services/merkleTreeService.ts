import * as helios from "@hyperionbt/helios";
import fetch from "node-fetch";
import ScriptOutbox from "../../onchain/scriptOutbox.hl";
import type { MerkleTreesByBlockNumberResponseType } from "../types";

export class MerkleTreeService {
  async getMerkleTreesAtBlockNumber(
    blockNumber: number
  ): Promise<MerkleTreesByBlockNumberResponseType> {
    const addressOutbox = helios.Address.fromValidatorHash(
      new ScriptOutbox().compile(true).validatorHash
    );

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

        if (block.height <= blockNumber) {
          const merkleTree = helios.ListData.fromCbor(
            helios.hexToBytes(utxo.inline_datum)
          ).list[0];
          return {
            blockNumber: block.height,
            merkleTrees: [
              {
                count: Number(merkleTree.list[1].int),
                branches: merkleTree.list[0].list.map((b) =>
                  helios.bytesToHex(b.bytes)
                ),
              },
            ],
          };
        }
      }
    }

    return { blockNumber, merkleTrees: [] };
  }
}
