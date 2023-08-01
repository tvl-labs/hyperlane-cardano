import { Buffer } from "buffer";
import assert from "assert";

/**
 * The 20-byte address on Ethereum is left-padded.
 * The 29-byte address on Cardano is left-padded.
 */
export class Address {
  private readonly bytes: Buffer;

  private constructor(bytes: Buffer) {
    this.bytes = bytes;
  }

  static fromHex(hex: string): Address {
    assert(hex.startsWith("0x"), `Invalid address ${hex}`);
    const bytes = Buffer.from(hex.substring(2), "hex");
    assert(bytes.length === 32, `Invalid address ${hex}`);
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

  static fromEvmAddress(hex: string): Address {
    return this.fromHex(`0x000000000000000000000000${hex.substring(2)}`);
  }

  toEvmAddress() {
    const hex = this.toHex();
    assert(
      hex.startsWith("0x000000000000000000000000"),
      `Non EVM address ${hex}`
    );
    return "0x" + hex.substring(26);
  }

  toString() {
    return this.toHex();
  }
}
