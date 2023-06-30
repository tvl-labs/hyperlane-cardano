import { MerkleTreeByBlockNumberResponseType } from '../types'

export class MerkleTreeService {
  async getMerkleTreeAtBlock(blockNumber: number): Promise<MerkleTreeByBlockNumberResponseType> {
    return {
      blockNumber,
      merkleTree: {
        count: 1,
        branches: []
      }
    }
  }
}