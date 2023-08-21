import { Buffer } from "buffer";
import { ethers } from "ethers";
import { H256 } from "../merkle/h256";

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
  rootSender: H256;
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
      rootSender.hex(),
      tokens,
      recipientAddressHash.hex(),
    ])
  );
}

export function parseMessagePayloadMint(
  payload: MessagePayload
): MessagePayloadMint {
  const abiCoder = new ethers.AbiCoder();
  const [rootChainId, rootSender, tokens, recipientAddressHash] =
    abiCoder.decode(messagePayloadMintABITypes, payload.toBuffer());
  return {
    rootChainId,
    rootSender: H256.fromHex(rootSender),
    tokens,
    recipientAddressHash: H256.fromHex(recipientAddressHash),
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
  "tuple(bytes, uint256)[]",
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
      tokens,
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
    tokens,
    interchainLiquidityHubPayload,
    isSwapWithAggregateToken,
    recipientAddress: H256.fromHex(recipientAddress),
    message,
  };
}
