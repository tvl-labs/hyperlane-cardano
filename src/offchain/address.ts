import { Buffer } from "buffer";
import assert from "assert";

/**
 * 32-byte address for Ethereum.
 * The 29-byte address on Cardano is left-padded with 3 0s.
 */
export class Address {
  private readonly bytes: Buffer;

  private constructor(bytes: Buffer) {
    this.bytes = bytes;
  }

  static fromHex(hex: string): Address {
    assert(hex.startsWith("0x"));
    const bytes = Buffer.from(hex.substring(2), "hex");
    assert(bytes.length === 32);
    return new Address(bytes);
  }

  toHex(): string {
    return "0x" + this.bytes.toString("hex");
  }

  toBuffer(): Buffer {
    return Buffer.from(this.bytes);
  }

  toJSON() {
    return this.toHex();
  }

  toEvmAddress() {
    const hex = this.toHex();
    assert(hex.startsWith("0x000000000000000000000000"));
    return "0x" + hex.substring(26);
  }

  toString() {
    return this.toHex();
  }
}
