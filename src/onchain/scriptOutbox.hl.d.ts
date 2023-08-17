import type * as helios from "@hyperionbt/helios";

declare class ScriptOutbox {
  constructor(params: { MP_KHALANI: helios.MintingPolicyHash });
  compile(optimize: boolean): helios.UplcProgram;
}

export default ScriptOutbox;
