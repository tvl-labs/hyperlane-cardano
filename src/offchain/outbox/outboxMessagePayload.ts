import { Buffer } from "buffer";

export class OutboxMessagePayload {
  private readonly bytes: Buffer;

  constructor(bytes: Buffer) {
    this.bytes = bytes;
  }

  static fromString(string: string) {
    return new OutboxMessagePayload(Buffer.from(string, "utf-8"));
  }

  static fromHexString(hexString: string) {
    return new OutboxMessagePayload(Buffer.from(hexString.substring(2), "hex"));
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
