import { blake2bHasher, keccak256Hasher } from './hasher';
import { SolidityMerkleTree } from './solidity.merkle';
import expect from 'expect';
import { HeliosMerkleTree } from './helios.merkle';
import { H256 } from './h256';
import { randomBytes } from 'crypto';

describe('merkle tree', () => {
  it('solidity merkle tree keccak256', () => {
    const merkleTree = new SolidityMerkleTree(keccak256Hasher);
    expect(merkleTree.root().hex())
      .toBe("0x27ae5ba08d7291c96c8cbddcc148bf48a6d68c7974b94356f53754ef6171d757")
  })

  it('helios merkle tree keccak256', () => {
    const merkleTree = new HeliosMerkleTree(keccak256Hasher);
    expect(merkleTree.root().hex())
      .toBe("0x27ae5ba08d7291c96c8cbddcc148bf48a6d68c7974b94356f53754ef6171d757")
  })

  it('merkle trees ingest same root keccak256', () => {
    const solidityMerkleTree = new SolidityMerkleTree(keccak256Hasher);
    const heliosMerkleTree = new HeliosMerkleTree(keccak256Hasher);
    const node = randomH256();

    solidityMerkleTree.ingest(node);
    heliosMerkleTree.ingest(node);

    expect(solidityMerkleTree.root().hex()).toBe(heliosMerkleTree.root().hex());
  })

  it('solidity merkle tree blake2b', () => {
    const merkleTree = new SolidityMerkleTree(blake2bHasher);
    expect(merkleTree.root().hex())
      .toBe("0x441508bfe8c5ba1bf1c2c0f8af3e4243a66cb6a9c76988e76ee62b197ba7369a")
  })

  it('helios merkle tree blake2b', () => {
    const merkleTree = new HeliosMerkleTree(blake2bHasher);
    expect(merkleTree.root().hex())
      .toBe("0x441508bfe8c5ba1bf1c2c0f8af3e4243a66cb6a9c76988e76ee62b197ba7369a")
  })

  it('merkle trees ingest same root blake2b', () => {
    const solidityMerkleTree = new SolidityMerkleTree(blake2bHasher);
    const heliosMerkleTree = new HeliosMerkleTree(blake2bHasher);
    const node = randomH256();

    solidityMerkleTree.ingest(node);
    heliosMerkleTree.ingest(node);

    expect(solidityMerkleTree.root().hex()).toBe(heliosMerkleTree.root().hex());
  })
})

function randomH256() {
  return H256.from(randomBytes(32));
}