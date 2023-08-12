import { Buffer } from "buffer";
import { ethers } from "ethers";
import type { Address } from "../offchain/address";

export type InterchainToken = [string, number];

export class MessagePayload {
  private readonly bytes: Buffer;

  constructor(bytes: Buffer) {
    this.bytes = bytes;
  }

  static fromString(string: string) {
    return new MessagePayload(Buffer.from(string, "utf-8"));
  }

  static fromHexString(hexString: string) {
    return new MessagePayload(Buffer.from(hexString.substring(2), "hex"));
  }

  sizeInBytes(): number {
    return this.bytes.length;
  }

  toBuffer(): Buffer {
    return Buffer.from(this.bytes);
  }

  toHex(): string {
    return "0x" + this.bytes.toString("hex");
  }

  toJSON() {
    return this.toHex();
  }

  toString() {
    return this.toHex();
  }
}

export function createMessagePayloadMint(
  rootChainId: number,
  rootSender: Address,
  tokens: InterchainToken[],
  target: Address
): MessagePayload {
  const abiCoder = new ethers.AbiCoder();
  return MessagePayload.fromHexString(
    abiCoder.encode(
      ["uint256", "bytes32", "tuple(bytes, uint256)[]", "bytes32"],
      [rootChainId, rootSender.toHex(), tokens, target.toHex()]
    )
  );
}
