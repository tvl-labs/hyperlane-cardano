import { Buffer } from "buffer";

// 32 bytes
// First byte denotes the name length,
// followed by the token name,
// then padded right by 0s to fit 32 bytes.
export class CardanoTokenName {
  private readonly buffer: Buffer;

  private constructor(buffer: Buffer) {
    this.buffer = buffer;
  }

  hex(): string {
    return "0x" + this.buffer.toString("hex");
  }

  toCardanoName(): number[] {
    const nameLength = this.buffer[0];
    return [...this.buffer.values()].slice(1, 1 + nameLength);
  }

  static fromTokenName(name: string) {
    const bytes: Buffer = Buffer.alloc(32);
    bytes[0] = name.length;
    const buffer = Buffer.from(name);
    buffer.copy(bytes, 1);
    return new CardanoTokenName(bytes);
  }

  static fromHex(hex: string) {
    return new CardanoTokenName(Buffer.from(hex.substring(2), "hex"));
  }

  toString() {
    return this.hex();
  }
}
