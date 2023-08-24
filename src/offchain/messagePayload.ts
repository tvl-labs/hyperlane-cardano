import { Buffer } from "buffer";
import { ethers } from "ethers";
import { H256 } from "./h256";
import { CardanoTokenName } from "../cardanoTokenName";

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

  static empty() {
    return new MessagePayload(Buffer.alloc(0));
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

export type InterchainToken = [CardanoTokenName, number];

export interface MessagePayloadMint {
  rootChainId: number;
  rootSender: H256;
  tokens: InterchainToken[];
  recipientAddressHash: H256;
  message: MessagePayload; // The full Cardano recipient address
}
const messagePayloadMintABITypes = [
  "uint256",
  "bytes32",
  "tuple(bytes32, uint256)[]",
  "bytes32",
  "bytes",
];

export function createMessagePayloadMint({
  rootChainId,
  rootSender,
  tokens,
  recipientAddressHash,
  message,
}: MessagePayloadMint): MessagePayload {
  const abiCoder = new ethers.AbiCoder();
  return MessagePayload.fromHexString(
    abiCoder.encode(messagePayloadMintABITypes, [
      rootChainId,
      rootSender.hex(),
      tokens.map((token) => [token[0].hex(), token[1]]),
      recipientAddressHash.hex(),
      message.toHex(),
    ])
  );
}

export function parseMessagePayloadMint(
  payload: MessagePayload
): MessagePayloadMint {
  const abiCoder = new ethers.AbiCoder();
  const [rootChainId, rootSender, tokens, recipientAddressHash, message] =
    abiCoder.decode(messagePayloadMintABITypes, payload.toBuffer());
  return {
    rootChainId,
    rootSender: H256.fromHex(rootSender),
    tokens: tokens.map((token) => [
      CardanoTokenName.fromHex(token[0]),
      token[1],
    ]),
    recipientAddressHash: H256.fromHex(recipientAddressHash),
    message: MessagePayload.fromHexString(message),
  };
}

export interface MessagePayloadBurn {
  sender: H256;
  destinationChainId: number;
  tokens: InterchainToken[];
  interchainLiquidityHubPayload: string; // Always empty at the moment
  isSwapWithAggregateToken: boolean; // Always false at the moment
  recipientAddress: H256;
  message: string; // Always empty at the moment
}
const messagePayloadBurnABITypes = [
  "bytes32",
  "uint256",
  "tuple(bytes32, uint256)[]",
  "bytes",
  "bool",
  "bytes32",
  "bytes",
];

export function createMessagePayloadBurn({
  sender,
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
      sender.hex(),
      destinationChainId,
      tokens.map((token) => [token[0].hex(), token[1]]),
      interchainLiquidityHubPayload,
      isSwapWithAggregateToken,
      recipientAddress.hex(),
      message,
    ])
  );
}

export function parseMessagePayloadBurn(
  payload: MessagePayload
): MessagePayloadBurn {
  const abiCoder = new ethers.AbiCoder();
  const [
    sender,
    destinationChainId,
    tokens,
    interchainLiquidityHubPayload,
    isSwapWithAggregateToken,
    recipientAddress,
    message,
  ] = abiCoder.decode(messagePayloadBurnABITypes, payload.toBuffer());
  return {
    sender: H256.fromHex(sender),
    destinationChainId,
    tokens: tokens.map((token) => [
      CardanoTokenName.fromHex(token[0]),
      token[1],
    ]),
    interchainLiquidityHubPayload,
    isSwapWithAggregateToken,
    recipientAddress: H256.fromHex(recipientAddress),
    message,
  };
}
