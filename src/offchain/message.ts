// Following Hyperlane as tight as possible
// https://github.com/hyperlane-xyz/hyperlane-monorepo/blob/main/solidity/contracts/libs/Message.sol

import * as helios from "@hyperionbt/helios";
import {
  bufferToHeliosByteArray,
  convertNumberToHeliosByteArray,
} from "./outbox/heliosByteArrayUtils";
import { blake2bHasher } from "../merkle/hasher";
import { Address } from "./address";
import { Buffer } from "buffer";
import { MessagePayload } from "./messagePayload";

const VERSION_SIZE = 1;
const NONCE_SIZE = 4;
const ORIGIN_DOMAIN_SIZE = 4;
const SENDER_SIZE = 32;
const DESTINATION_DOMAIN_SIZE = 4;
const RECIPIENT_SIZE = 32;

export interface Message {
  /**
   * 1-byte version of the messaging protocol.
   */
  version: number;
  /**
   * 4-byte nonce sequential number of the message equal to the Outbox's MerkleTree count.
   */
  nonce: number;
  /**
   * 4-byte number of the Hyperlane-provided origin domain (Ethereum = 1, Polygon = 137, etc)
   */
  originDomain: number;
  /**
   * 32-byte address of the sender on Cardano.
   */
  sender: Address;
  /**
   * 4-byte number of the Hyperlane-provided destination domain (Ethereum = 1, Polygon = 137, etc)
   */
  destinationDomain: number;
  /**
   * 32-byte address of the recipient.
   */
  // TODO: Support address with stake credentials.
  recipient: Address;
  /**
   * Message payload, arbitrary size below ~1Kb.
   */
  body: MessagePayload;
}

export function calculateMessageId(message: Message) {
  const buffer = Buffer.alloc(
    VERSION_SIZE +
      NONCE_SIZE +
      ORIGIN_DOMAIN_SIZE +
      SENDER_SIZE +
      DESTINATION_DOMAIN_SIZE +
      RECIPIENT_SIZE +
      message.body.sizeInBytes()
  );
  let offset = 0;
  buffer.writeUint8(message.version, offset);
  offset += VERSION_SIZE;
  buffer.writeUint32BE(message.nonce, offset);
  offset += NONCE_SIZE;
  buffer.writeUint32BE(message.originDomain, offset);
  offset += ORIGIN_DOMAIN_SIZE;
  message.sender.toBuffer().copy(buffer, offset);
  offset += SENDER_SIZE;
  buffer.writeUint32BE(message.destinationDomain, offset);
  offset += DESTINATION_DOMAIN_SIZE;
  message.recipient.toBuffer().copy(buffer, offset);
  offset += RECIPIENT_SIZE;
  message.body.toBuffer().copy(buffer, offset);
  return blake2bHasher(buffer);
}

export function serializeMessage(message: Message) {
  return new helios.ListData([
    convertNumberToHeliosByteArray(message.version, 1)._toUplcData(),
    convertNumberToHeliosByteArray(message.nonce, 4)._toUplcData(),
    convertNumberToHeliosByteArray(message.originDomain, 4)._toUplcData(),
    bufferToHeliosByteArray(message.sender.toBuffer())._toUplcData(),
    convertNumberToHeliosByteArray(message.destinationDomain, 4)._toUplcData(),
    bufferToHeliosByteArray(message.recipient.toBuffer())._toUplcData(),
    bufferToHeliosByteArray(message.body.toBuffer())._toUplcData(),
  ]);
}

export function deserializeMessage(message: helios.ListData): Message {
  return {
    version: parseInt(helios.bytesToHex(message.list[0].bytes), 16),
    nonce: parseInt(helios.bytesToHex(message.list[1].bytes), 16),
    originDomain: parseInt(helios.bytesToHex(message.list[2].bytes), 16),
    sender: Address.fromHex(`0x${helios.bytesToHex(message.list[3].bytes)}`),
    destinationDomain: parseInt(helios.bytesToHex(message.list[4].bytes), 16),
    recipient: Address.fromHex(`0x${helios.bytesToHex(message.list[5].bytes)}`),
    body: MessagePayload.fromHexString(
      `0x${helios.bytesToHex(message.list[6].bytes)}`
    ),
  };
}

export function toJsonMessage(message: Message) {
  return {
    ...message,
    sender: message.sender.toJSON(),
    recipient: message.recipient.toJSON(),
    body: message.body.toJSON(),
  };
}
