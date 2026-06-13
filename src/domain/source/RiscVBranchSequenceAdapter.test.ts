import { describe, expect, it } from "vitest";
import { RiscVBranchSequenceAdapter } from "./RiscVBranchSequenceAdapter";
import type { RiscVProgram } from "./RiscVProgram";

const adapter = new RiscVBranchSequenceAdapter();

describe("RiscVBranchSequenceAdapter", () => {
  it("reconstructs a flat branch sequence from parsed branches and outcome hints", () => {
    const program: RiscVProgram = {
      instructions: [],
      branches: [
        {
          id: "B1",
          address: 16,
          opcode: "bge",
          targetLabel: "end",
          lineNumber: 5
        }
      ]
    };

    const result = adapter.fromProgram(program, [
      { branchId: "B1", outcomes: ["NT", "NT", "NT", "T"] }
    ]);

    expect(result.diagnostics).toEqual([]);
    expect(result.branchSequence).toEqual({
      executions: [
        { order: 0, branchId: "B1", actual: "NT", address: 16, manualIndex: 0 },
        { order: 1, branchId: "B1", actual: "NT", address: 16, manualIndex: 0 },
        { order: 2, branchId: "B1", actual: "NT", address: 16, manualIndex: 0 },
        { order: 3, branchId: "B1", actual: "T", address: 16, manualIndex: 0 }
      ],
      loops: []
    });
  });

  it("reports hints without matching RISC-V branches", () => {
    const result = adapter.fromProgram({ instructions: [], branches: [] }, [
      { branchId: "B9", outcomes: ["T"] }
    ]);

    expect(result.branchSequence.executions).toEqual([]);
    expect(result.diagnostics).toEqual([
      {
        severity: "warning",
        message: "Outcome hint B9 does not match any RISC-V branch."
      }
    ]);
  });
});
