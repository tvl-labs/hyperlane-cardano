import { MerkleTreesByBlockNumberResponseType } from '../types';

export interface IMerkleTreeService {
  getMerkleTreesAtBlockNumber(
    blockNumber: number
  ): Promise<MerkleTreesByBlockNumberResponseType>;
}

