import fetch from "node-fetch";
import type { LastFinalizedBlockResponseType } from "../types";

export class LastFinalizedBlockNumberService {
  async getLastFinalizedBlockNumber(): Promise<LastFinalizedBlockResponseType> {
    const block: any = await fetch(
      "https://cardano-preview.blockfrost.io/api/v0/blocks/latest",
      {
        headers: {
          project_id: process.env.BLOCKFROST_PROJECT_ID ?? "",
        },
      }
    ).then(async (r) => await r.json());
    return { lastFinalizedBlock: block.height };
  }
}
