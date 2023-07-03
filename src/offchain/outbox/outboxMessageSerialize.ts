import * as helios from "@hyperionbt/helios";
import {
  bufferToHeliosByteArray,
  convertNumberToHeliosByteArray,
} from "./heliosByteArrayUtils";
import type { OutboxMessage } from "./outboxMessage";

export function serializeOutboxRedeemer(outboxMessage: OutboxMessage) {
  return new helios.ListData([
    convertNumberToHeliosByteArray(outboxMessage.version, 1)._toUplcData(),
    convertNumberToHeliosByteArray(outboxMessage.nonce, 4)._toUplcData(),
    convertNumberToHeliosByteArray(outboxMessage.originDomain, 4)._toUplcData(),
    bufferToHeliosByteArray(outboxMessage.sender.toBuffer())._toUplcData(),
    convertNumberToHeliosByteArray(
      outboxMessage.destinationDomain,
      4
    )._toUplcData(),
    bufferToHeliosByteArray(outboxMessage.recipient.toBuffer())._toUplcData(),
  ]);
}
