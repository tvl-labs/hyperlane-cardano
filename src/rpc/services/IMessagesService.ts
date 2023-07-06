import { MessagesByBlockRangeResponseType } from '../types';

export interface IMessagesService {
  getMessagesInBlockRange(
    fromBlock: number,
    toBlock: number
  ): Promise<MessagesByBlockRangeResponseType>;
}
