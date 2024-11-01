import * as helios from "@hyperionbt/helios";
import { Buffer } from "buffer";
import { ethers } from "ethers";
import { H256 } from "./h256";

export type Hasher = (Buffer) => H256;

export const keccak256Hasher: Hasher = (data: Buffer) =>
  H256.from(Buffer.from(ethers.getBytes(ethers.keccak256(data))));

export function blake2bHasher(data: Buffer) {
  return H256.from(Buffer.from(helios.Crypto.blake2b([...data.values()])));
}

export function hashConcat(hasher: Hasher, left: H256, right: H256) {
  return hasher(Buffer.concat([left.toBuffer(), right.toBuffer()]));
}
