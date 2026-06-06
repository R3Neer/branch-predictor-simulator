import { describe, expect, it } from "vitest";
import { StatAnswerParser } from "./StatAnswerParser";

describe("StatAnswerParser", () => {
  it("parses integers, fractions, percentages and units", () => {
    const parser = new StatAnswerParser();

    expect(parser.parse("2")).toEqual({ kind: "number", value: 2, rawUnit: undefined });
    expect(parser.parse("2/4")).toEqual({ kind: "ratio", value: 0.5, rawUnit: undefined });
    expect(parser.parse("50%")).toEqual({ kind: "ratio", value: 0.5, rawUnit: "%" });
    expect(parser.parse("8 bits", "bits")).toEqual({ kind: "number", value: 8, rawUnit: "bits" });
  });

  it("rejects invalid numeric answers", () => {
    expect(() => new StatAnswerParser().parse("abc")).toThrow("invalid numeric answer");
    expect(() => new StatAnswerParser().parse("1/0")).toThrow(RangeError);
  });
});
