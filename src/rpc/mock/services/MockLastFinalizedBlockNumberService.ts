import { LastFinalizedBlockResponseType } from '../../types';
import { ILastFinalizedBlockNumberService } from '../../services/ILastFinalizedBlockNumberService';
import { mockLastFinalizedBlock } from '../mock';

export class MockLastFinalizedBlockNumberService implements ILastFinalizedBlockNumberService {
  async getLastFinalizedBlockNumber(): Promise<LastFinalizedBlockResponseType> {
    return {
      lastFinalizedBlock: mockLastFinalizedBlock,
    }
  }
}