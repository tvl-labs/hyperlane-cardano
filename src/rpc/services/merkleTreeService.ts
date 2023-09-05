import * as helios from "@hyperionbt/helios";
import fetch from "node-fetch";
import { getProgramOutbox } from "../../onchain/programs";
import type { MerkleTreeResponseType } from "../types";
import { type IMerkleTreeService } from "./interfaces/IMerkleTreeService";
import {
  blockfrostPrefix,
  blockfrostProjectId,
} from "../../offchain/blockfrost/blockfrost";
import { getOutboxParams } from "../../offchain/outbox/outboxParams";

export class MerkleTreeService implements IMerkleTreeService {
  // TODO: Better error handling
  async getLatestMerkleTree(): Promise<MerkleTreeResponseType> {
    const addressOutbox = helios.Address.fromValidatorHash(
      getProgramOutbox().validatorHash
    );

    const { outboxAuthToken } = getOutboxParams();

    // NOTE: We assume only a single UTxO exists for an NFT auth token
    const [utxo]: any = await fetch(
      `${blockfrostPrefix}/addresses/${addressOutbox.toBech32()}/utxos/${outboxAuthToken}`,
      {
        headers: {
          project_id: blockfrostProjectId,
        },
      }
    ).then(async (r) => await r.json());

    const block: any = await fetch(
      `${blockfrostPrefix}/blocks/${utxo.block as string}`,
      {
        headers: {
          project_id: blockfrostProjectId,
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
