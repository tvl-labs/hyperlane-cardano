import { LastFinalizedBlockResponseType } from '../types'

export class LastFinalizedBlockNumberService {
  async getLastFinalizedBlockNumber(): Promise<LastFinalizedBlockResponseType> {
    return {
      lastFinalizedBlock: 13
    }
  }
}