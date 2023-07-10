import { type MessagesByBlockRangeResponseType } from "../../types";
import { mockOutboxMailboxStates } from "../mock";
import { type IMessagesService } from "../../services/IMessagesService";
import { convertMessageResponseType } from "../../conversion/convertMessageResponseType";

export class MockMessagesService implements IMessagesService {
  async getMessagesInBlockRange(
    fromBlock: number,
    toBlock: number
  ): Promise<MessagesByBlockRangeResponseType> {
    return {
      messages: mockOutboxMailboxStates
        .filter(
          (ms) => fromBlock <= ms.blockNumber && ms.blockNumber <= toBlock
        )
        .map((ms) => ({
          block: ms.blockNumber,
          message: convertMessageResponseType(ms.message),
        })),
    };
  }
}
