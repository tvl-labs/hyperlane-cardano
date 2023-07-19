import type * as helios from "@hyperionbt/helios";
import type { IsmParamsHelios } from "../offchain/inbox/ismParams";

declare class MintingPolicyIsmMultiSig {
  constructor(params: IsmParamsHelios);
  compile(optimize: boolean): helios.UplcProgram;
}

export default MintingPolicyIsmMultiSig;
