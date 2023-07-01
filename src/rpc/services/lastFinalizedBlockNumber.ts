import { LastFinalizedBlockResponseType } from '../types'

import { getLastFinalizedBlockNumber } from '../mock/mock'

export class LastFinalizedBlockNumberService {
  async getLastFinalizedBlockNumber(): Promise<LastFinalizedBlockResponseType> {
    return getLastFinalizedBlockNumber()
  }
}