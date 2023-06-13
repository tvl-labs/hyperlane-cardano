import * as helios from "@hyperionbt/helios";

declare class ScriptLockForever {
  constructor();
  compile(optimize: boolean): helios.UplcProgram;
}

export default ScriptLockForever;
