import type * as helios from "@hyperionbt/helios";

declare class ScriptKhalani {
  constructor();
  compile(optimize: boolean): helios.UplcProgram;
}

export default ScriptKhalani;
