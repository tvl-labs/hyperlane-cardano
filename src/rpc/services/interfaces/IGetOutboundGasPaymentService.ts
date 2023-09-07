import type * as helios from "@hyperionbt/helios";

export interface IGetOutboundGasPayment {
  getOutboundGasPayment: (
    relayerAddress: helios.Address,
    messageId: helios.ByteArrayData
  ) => Promise<number>;
}
