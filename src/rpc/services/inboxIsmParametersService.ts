import type { InboxIsmParametersResponseType } from "../types";
import { type IInboxIsmParametersService } from "./IInboxIsmParametersService";
import { getIsmParams } from "../../offchain/inbox";

export class InboxIsmParametersService implements IInboxIsmParametersService {
  async getInboxIsmParameters(): Promise<InboxIsmParametersResponseType> {
    const ismParams = getIsmParams();
    return {
      validators: ismParams.validators.map((a) => a.toHex()),
      threshold: Number(ismParams.threshold),
    };
  }
}
