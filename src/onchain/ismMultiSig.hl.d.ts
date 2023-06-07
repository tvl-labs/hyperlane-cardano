import * as helios from "@hyperionbt/helios";

declare class MintingPolicyIsmMultiSig {
  constructor(params: {
    VK_OWNERS: helios.ByteArray[];
    NUM_SIGNATURES_REQUIRED: bigint;
    ADDR_MESSAGE: helios.Address;
  });
  compile(optimize: boolean): helios.UplcProgram;
}

export default MintingPolicyIsmMultiSig;
