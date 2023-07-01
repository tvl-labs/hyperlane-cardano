import { MessagesByBlockRangeResponseType } from '../types'
import { getMessagesInBlockRange } from '../mock/mock'

export class MessagesService {
  async getMessagesInBlockRange(
    fromBlock: number,
    toBlock: number
  ): Promise<MessagesByBlockRangeResponseType> {
    return getMessagesInBlockRange(fromBlock, toBlock)
  }
}