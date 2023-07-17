import type * as helios from "@hyperionbt/helios";

declare class ScriptOutbox {
  constructor();
  compile(optimize: boolean): helios.UplcProgram;
}

export default ScriptOutbox;
