import type * as helios from "@hyperionbt/helios";

declare class MintingPolicyMaster {
  constructor(params: { MASTER_PKH: helios.PubKeyHash });
  compile(optimize: boolean): helios.UplcProgram;
}

export default MintingPolicyMaster;
