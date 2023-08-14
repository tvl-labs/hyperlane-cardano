import * as helios from "@hyperionbt/helios";
import { Buffer } from "buffer";
import { ethers } from "ethers";
import { Address } from "../offchain/address";

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

export type InterchainToken = [string, number];
export interface MessagePayloadMint {
  rootChainId: number;
  rootSender: Address;
  tokens: InterchainToken[];
  target: helios.Address;
}
const messagePayloadMintABITypes = [
  "uint256",
  "bytes32",
  "tuple(bytes, uint256)[]",
  "bytes",
];

export function createMessagePayloadMint({
  rootChainId,
  rootSender,
  tokens,
  target,
}: MessagePayloadMint): MessagePayload {
  const abiCoder = new ethers.AbiCoder();
  return MessagePayload.fromHexString(
    abiCoder.encode(messagePayloadMintABITypes, [
      rootChainId,
      rootSender.toHex(),
      tokens,
      `0x${target.toHex()}`,
    ])
  );
}

export function parseMessagePayloadMint(
  payload: MessagePayload
): MessagePayloadMint {
  const abiCoder = new ethers.AbiCoder();
  const [rootChainId, rootSender, tokens, target] = abiCoder.decode(
    messagePayloadMintABITypes,
    payload.toBuffer()
  );
  return {
    rootChainId,
    rootSender: Address.fromHex(rootSender),
    tokens,
    target: new helios.Address(target.substring(2)),
  };
}
