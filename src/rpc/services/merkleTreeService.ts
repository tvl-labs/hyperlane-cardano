import { MerkleTreesByBlockNumberResponseType } from '../types'
import { getMerkleTreesAtBlockNumber } from '../mock/mock'

export class MerkleTreeService {
  async getMerkleTreesAtBlockNumber(blockNumber: number): Promise<MerkleTreesByBlockNumberResponseType> {
    return getMerkleTreesAtBlockNumber(blockNumber)
  }
}