import type * as helios from "@hyperionbt/helios";

declare class ScriptInbox {
  constructor();
  compile(optimize: boolean): helios.UplcProgram;
}

export default ScriptInbox;
