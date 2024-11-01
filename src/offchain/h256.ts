import { Buffer } from "buffer";
import assert from "assert";

export class H256 {
  private readonly buffer: Buffer;

  private constructor(buffer: Buffer) {
    this.buffer = buffer;
  }

  hex(): string {
    return "0x" + this.buffer.toString("hex");
  }

  toBuffer(): Buffer {
    const copy = Buffer.alloc(32);
    this.buffer.copy(copy);
    return copy;
  }

  toByteArray(): number[] {
    return [...this.buffer.values()];
  }

  static from(buffer: Buffer) {
    assert(
      buffer.length === 32,
      `Buffer size must be 32 bytes but was ${buffer.length}`
    );
    return new H256(buffer);
  }

  static fromHex(hex: string) {
    assert(hex.startsWith("0x"), `Invalid bytestring ${hex}`);
    const bytes = Buffer.from(hex.substring(2), "hex");
    assert(bytes.length === 32, `Invalid bytestring ${hex}`);
    return new H256(bytes);
  }

  static zero(): H256 {
    return new H256(Buffer.alloc(32));
  }

  toJSON() {
    return this.hex();
  }

  toString() {
    return this.hex();
  }
}
