import { MessagesByBlockRangeResponseType } from '../types'

export class MessagesService {
  async getMessagesInBlockRange(fromBlock: number, toBlock: number): Promise<MessagesByBlockRangeResponseType> {
    return {
      messages: [
        {
          block: 1,
          message: {
            version: 0,
            nonce: 0,
            destinationDomain: '',
            originDomain: '',
            sender: '',
            recipient: '',
            body: ''
          }
        }
      ]
    }
  }
}