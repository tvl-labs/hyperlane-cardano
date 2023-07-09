import * as helios from "@hyperionbt/helios";
import fetch from "node-fetch";
import ScriptOutbox from "../../onchain/scriptOutbox.hl";
import type { MerkleTreeResponseType } from "../types";

export class MerkleTreeService {
  // TODO: Better error handling
  async getMerkleTree(): Promise<MerkleTreeResponseType> {
    const addressOutbox = helios.Address.fromValidatorHash(
      new ScriptOutbox().compile(true).validatorHash
    );

    // NOTE: We assume only a single UTxO exists for an NFT auth token
    const [utxo]: any = await fetch(
      `${
        process.env.BLOCKFROST_PREFIX ?? ""
      }/addresses/${addressOutbox.toBech32()}/utxos/${
        process.env.OUTBOX_AUTH_TOKEN ?? ""
      }`,
      {
        headers: {
          project_id: process.env.BLOCKFROST_PROJECT_ID ?? "",
        },
      }
    ).then(async (r) => await r.json());

    const block: any = await fetch(
      `${process.env.BLOCKFROST_PREFIX ?? ""}/blocks/${utxo.block as string}`,
      {
        headers: {
          project_id: process.env.BLOCKFROST_PROJECT_ID ?? "",
        },
      }
    ).then(async (r) => await r.json());

    const merkleTree = helios.ListData.fromCbor(
      helios.hexToBytes(utxo.inline_datum)
    ).list[0];

    return {
      blockNumber: block.height,
      merkleTree: {
        count: Number(merkleTree.list[1].int),
        branches: merkleTree.list[0].list.map((b) =>
          helios.bytesToHex(b.bytes)
        ),
      },
    };
  }
}
