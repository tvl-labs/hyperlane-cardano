import type * as helios from "@hyperionbt/helios";
import type { AppParams } from "../typing";

declare class MintingPolicyIsmMultiSig {
  constructor(params: AppParams);
  compile(optimize: boolean): helios.UplcProgram;
}

export default MintingPolicyIsmMultiSig;
