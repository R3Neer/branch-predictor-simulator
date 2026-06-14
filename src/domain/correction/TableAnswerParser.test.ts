import { describe, expect, it } from "vitest";
import { TableAnswerParser } from "./TableAnswerParser";

describe("TableAnswerParser", () => {
  it("parses table answer lines", () => {
    expect(
      new TableAnswerParser().parse(`
1 pred=NT hit=miss counter=10
2 prediction=T # partial answer
`)
    ).toEqual([
      { step: 1, prediction: "NT", hit: "miss", counterAfter: "10" },
      { step: 2, prediction: "T", hit: undefined, counterAfter: undefined }
    ]);
  });

  it("rejects invalid fields", () => {
    expect(() => new TableAnswerParser().parse("1 real=T")).toThrow("unknown answer field");
  });
});
