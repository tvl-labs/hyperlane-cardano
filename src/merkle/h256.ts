import { Buffer } from 'buffer';
import assert from 'assert';

export class H256 {

  private buffer: Buffer;

  private constructor(buffer: Buffer) {
    this.buffer = buffer;
  }

  hex(): string {
    return '0x' + this.buffer.toString('hex');
  }

  toBuffer(): Buffer {
    const copy = Buffer.alloc(32);
    this.buffer.copy(copy);
    return copy;
  }

  static from(buffer: Buffer) {
    assert(buffer.length === 32);
    return new H256(buffer);
  }

  static zero(): H256 {
    return new H256(Buffer.alloc(32));
  }
}