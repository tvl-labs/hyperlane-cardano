import * as helios from "@hyperionbt/helios";
import { Buffer } from "buffer";

export function bufferToHeliosByteArray(
  buffer: Buffer | Uint8Array
): helios.ByteArray {
  const numbers = [...buffer.valueOf()];
  return new helios.ByteArray(numbers);
}

export function convertNumberToHeliosByteArray(
  x: number,
  size: 1 | 4
): helios.ByteArray {
  const buf = Buffer.alloc(size);
  if (size === 1) {
    buf.writeUint8(x);
  }
  if (size === 4) {
    buf.writeUint32BE(x);
  }
  return bufferToHeliosByteArray(buf);
}
