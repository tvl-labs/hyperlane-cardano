import { MerkleTreesByBlockNumberResponseType } from '../../types';
import { IMerkleTreeService } from '../../services/IMerkleTreeService';
import { mockOutboxMailboxStates } from '../mock';

export class MockMerkleTreeService implements IMerkleTreeService {
  async getMerkleTreesAtBlockNumber(blockNumber: number): Promise<MerkleTreesByBlockNumberResponseType> {
    let states = mockOutboxMailboxStates.filter((ms) => ms.blockNumber === blockNumber);
    if (states.length === 0) {
      const previousStates = mockOutboxMailboxStates.filter(
        (ms) => ms.blockNumber < blockNumber
      );
      if (previousStates.length === 0) {
        return {
          blockNumber,
          merkleTrees: [],
        };
      }
      states = [previousStates[previousStates.length - 1]];
    }
    const merkleTrees = states.map((ms) => ({
      count: ms.merkleTree.getCount(),
      branches: ms.merkleTree.getBranches().map((h) => h.hex()),
    }));
    return {
      blockNumber,
      merkleTrees,
    };
  }
}