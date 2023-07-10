import * as helios from "@hyperionbt/helios";
import {
  bufferToHeliosByteArray,
  convertNumberToHeliosByteArray,
} from "./outbox/heliosByteArrayUtils";
import type { Message } from "./message";

export function serializeOutboxRedeemer(message: Message) {
  return new helios.ListData([
    convertNumberToHeliosByteArray(message.version, 1)._toUplcData(),
    convertNumberToHeliosByteArray(message.nonce, 4)._toUplcData(),
    convertNumberToHeliosByteArray(message.originDomain, 4)._toUplcData(),
    bufferToHeliosByteArray(message.sender.toBuffer())._toUplcData(),
    convertNumberToHeliosByteArray(message.destinationDomain, 4)._toUplcData(),
    bufferToHeliosByteArray(message.recipient.toBuffer())._toUplcData(),
  ]);
}
