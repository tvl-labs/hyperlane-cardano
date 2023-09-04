import type * as helios from "@hyperionbt/helios";
import { type IGetOutboundGasPayment } from "./interfaces/IGetOutboundGasPaymentService";
import { getOutboundGasPayment } from "../../offchain/indexer/getOutboundGasPayment";

export class GetOutboundGasPaymentService implements IGetOutboundGasPayment {
  async getOutboundGasPayment(
    relayerAddress: helios.Address,
    messageId: helios.ByteArray
  ): Promise<number> {
    const fee = await getOutboundGasPayment(relayerAddress, messageId);
    return Number(fee);
  }
}
