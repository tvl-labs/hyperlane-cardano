import { type LastFinalizedBlockResponseType } from "../../types";
import { type ILastFinalizedBlockNumberService } from "../../services/ILastFinalizedBlockNumberService";
import { mockLastFinalizedBlock } from "../mock";

export class MockLastFinalizedBlockNumberService
  implements ILastFinalizedBlockNumberService
{
  async getLastFinalizedBlockNumber(): Promise<LastFinalizedBlockResponseType> {
    return {
      lastFinalizedBlock: mockLastFinalizedBlock,
    };
  }
}
