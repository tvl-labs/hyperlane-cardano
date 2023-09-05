import type { InboxIsmParametersResponseType } from "../types";
import { type IInboxIsmParametersService } from "./interfaces/IInboxIsmParametersService";
import { getIsmParamsHelios } from "../../offchain/inbox";
import { Address } from "../../offchain/address";
import { ethers } from "ethers";

export class InboxIsmParametersService implements IInboxIsmParametersService {
  async getInboxIsmParameters(): Promise<InboxIsmParametersResponseType> {
    const ismParamsHelios = getIsmParamsHelios();

    const validators = ismParamsHelios.VALIDATOR_VKEYS.map((validatorKey) =>
      Address.fromEvmAddress(ethers.computeAddress(`0x${validatorKey.hex}`))
    );

    return {
      validators: validators.map((a) => a.toHex()),
      threshold: Number(ismParamsHelios.THRESHOLD),
    };
  }
}
