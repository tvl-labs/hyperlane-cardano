import fetch from "node-fetch";
import type { LastFinalizedBlockResponseType } from "../types";
import { type ILastFinalizedBlockNumberService } from "./ILastFinalizedBlockNumberService";
import {
  blockfrostPrefix,
  blockfrostProjectId,
} from "../../offchain/indexer/blockfrost";

export class LastFinalizedBlockNumberService
  implements ILastFinalizedBlockNumberService {
  async getLastFinalizedBlockNumber(): Promise<LastFinalizedBlockResponseType> {
    const block: any = await fetch(`${blockfrostPrefix}/blocks/latest`, {
      headers: {
        project_id: blockfrostProjectId,
      },
    }).then(async (r) => await r.json());
    return { lastFinalizedBlock: block.height };
  }
}
