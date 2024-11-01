import { type LastFinalizedBlockResponseType } from "../../types";

export interface ILastFinalizedBlockNumberService {
  getLastFinalizedBlockNumber: () => Promise<LastFinalizedBlockResponseType>;
}
