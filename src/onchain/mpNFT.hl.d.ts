import type * as helios from "@hyperionbt/helios";

declare class MintingPolicyNFT {
  constructor(params: { OUTPUT_ID: helios.TxOutputId });
  compile(optimize: boolean): helios.UplcProgram;
}

export default MintingPolicyNFT;
