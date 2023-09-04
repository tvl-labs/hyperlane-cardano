import { type MerkleTreeResponseType } from "../../types";

export interface IMerkleTreeService {
  getLatestMerkleTree: () => Promise<MerkleTreeResponseType>;
}
