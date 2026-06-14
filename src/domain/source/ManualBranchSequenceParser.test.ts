import { describe, expect, it } from "vitest";
import { ManualBranchSequenceParser } from "./ManualBranchSequenceParser";

describe("ManualBranchSequenceParser", () => {
  it("parses branch executions with optional index, address and comments", () => {
    const sequence = new ManualBranchSequenceParser().parse(`
B1 T index=0 address=0x10 # first branch
B2 NT i=1 addr=20
`);

    expect(sequence).toEqual({
      executions: [
        { order: 0, branchId: "B1", actual: "T", manualIndex: 0, address: 16, comment: "first branch" },
        { order: 1, branchId: "B2", actual: "NT", manualIndex: 1, address: 20, comment: undefined }
      ],
      loops: []
    });
  });

  it("parses loop ranges", () => {
    const sequence = new ManualBranchSequenceParser().parse(`
B1 T index=0
B1 NT index=0
loop 0..1 x3
`);

    expect(sequence.loops).toEqual([{ startOrder: 0, endOrder: 1, repetitions: 3 }]);
  });

  it("formats branch sequences back to editable text", () => {
    const parser = new ManualBranchSequenceParser();

    expect(
      parser.format({
        executions: [{ order: 0, branchId: "B1", actual: "T", manualIndex: 0, address: 16 }],
        loops: [{ startOrder: 0, endOrder: 0, repetitions: 2 }]
      })
    ).toBe("B1 T index=0 address=0x10\nloop 0..0 x2");
  });
});
