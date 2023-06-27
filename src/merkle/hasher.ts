import { Buffer } from 'buffer';
import { H256 } from './h256';
import keccak256 from 'keccak256';
import { blake2bFinal, blake2bInit, blake2bUpdate } from 'blakejs';

export type Hasher = (Buffer) => H256;

export const keccak256Hasher: Hasher = (data: Buffer) => H256.from(keccak256(data));

export function blake2bHasher(data: Buffer) {
  const ctx = blake2bInit(32);
  blake2bUpdate(ctx, [...data.values()]);
  const uint8Array = blake2bFinal(ctx);
  return H256.from(Buffer.from(uint8Array));
}

export function hashConcat(
  hasher: Hasher,
  left: H256,
  right: H256
) {
  return hasher(Buffer.concat([left.toBuffer(), right.toBuffer()]));
}
