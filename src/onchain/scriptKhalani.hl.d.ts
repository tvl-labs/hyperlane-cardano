import type * as helios from "@hyperionbt/helios";

declare class ScriptKhalani {
  constructor(params: { MP_KHALANI: helios.MintingPolicyHash });
  compile(optimize: boolean): helios.UplcProgram;
}

export default ScriptKhalani;
