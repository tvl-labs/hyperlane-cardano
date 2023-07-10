import { type MerkleTreeResponseType } from "../../types";
import { type IMerkleTreeService } from "../../services/IMerkleTreeService";
import { mockOutboxMailboxStates } from "../mock";

export class MockMerkleTreeService implements IMerkleTreeService {
  async getLatestMerkleTree(): Promise<MerkleTreeResponseType> {
    const mailboxState =
      mockOutboxMailboxStates[mockOutboxMailboxStates.length - 1];
    return {
      blockNumber: mailboxState.blockNumber,
      merkleTree: {
        count: mailboxState.merkleTree.getCount(),
        branches: mailboxState.merkleTree.getBranches().map((h) => h.hex()),
      },
    };
  }
}
