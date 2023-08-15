import { Buffer } from "buffer";
import { ethers } from "ethers";
import { H256 } from "../merkle/h256";
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
  recipientAddressHash: H256;
  // TODO: Add another message body here?
}
const messagePayloadMintABITypes = [
  "uint256",
  "bytes32",
  "tuple(bytes, uint256)[]",
  "bytes32",
];

export function createMessagePayloadMint({
  rootChainId,
  rootSender,
  tokens,
  recipientAddressHash,
}: MessagePayloadMint): MessagePayload {
  const abiCoder = new ethers.AbiCoder();
  return MessagePayload.fromHexString(
    abiCoder.encode(messagePayloadMintABITypes, [
      rootChainId,
      rootSender.toHex(),
      tokens,
      recipientAddressHash.hex(),
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
    recipientAddressHash: H256.from(Buffer.from(target.substring(2), "hex")),
  };
}

export interface MessagePayloadBurn {
  senderAddressHash: Address;
  destinationChainId: number;
  tokens: InterchainToken[];
  interchainLiquidityHubPayload: string; // Always empty at the moment
  isSwapWithAggregateToken: boolean; // Always false at the moment
  recipientAddress: Address;
  message: string; // Always empty at the moment
}
const messagePayloadBurnABITypes = [
  "address",
  "uint256",
  "tuple(address, uint256)[]",
  "bytes",
  "bool",
  "address",
  "bytes",
];

export function createMessagePayloadBurn({
  senderAddressHash,
  destinationChainId,
  tokens,
  interchainLiquidityHubPayload,
  isSwapWithAggregateToken,
  recipientAddress,
  message,
}: MessagePayloadBurn): MessagePayload {
  const abiCoder = new ethers.AbiCoder();
  return MessagePayload.fromHexString(
    abiCoder.encode(messagePayloadBurnABITypes, [
      senderAddressHash.toHex(),
      destinationChainId,
      tokens,
      interchainLiquidityHubPayload,
      isSwapWithAggregateToken,
      recipientAddress.toEvmAddress(),
      message,
    ])
  );
}
