import { MerkleTreesByBlockNumberResponseType } from '../types'
import { HeliosMerkleTree } from '../../merkle/helios.merkle'
import { blake2bHasher } from '../../merkle/hasher'

export class MerkleTreeService {
  async getMerkleTreesByBlockNumber(blockNumber: number): Promise<MerkleTreesByBlockNumberResponseType> {
    const merkleTree = new HeliosMerkleTree(blake2bHasher)
    return {
      blockNumber,
      merkleTrees: [
        {
          count: merkleTree.getCount(),
          branches: merkleTree.getBranches().map((b) => b.hex())
        }
      ]
    }
  }
}