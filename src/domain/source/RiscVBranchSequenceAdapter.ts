import type { BranchExecution, BranchSequence } from "../simulation/BranchSequence";
import type { BranchOutcomeHint } from "./CTranslator";
import type { RiscVProgram } from "./RiscVProgram";

export interface BranchSequenceReconstructionDiagnostic {
  readonly severity: "warning";
  readonly message: string;
}

export interface BranchSequenceReconstructionResult {
  readonly branchSequence: BranchSequence;
  readonly diagnostics: readonly BranchSequenceReconstructionDiagnostic[];
}

export class RiscVBranchSequenceAdapter {
  fromProgram(
    program: RiscVProgram,
    hints: readonly BranchOutcomeHint[]
  ): BranchSequenceReconstructionResult {
    const diagnostics: BranchSequenceReconstructionDiagnostic[] = [];
    const branchesById = new Map(program.branches.map((branch) => [branch.id, branch]));
    const hintsByBranchId = new Map(hints.map((hint) => [hint.branchId.toUpperCase(), hint]));
    const manualIndexesByBranchId = new Map(
      program.branches.map((branch, index) => [branch.id, index])
    );
    const executions: BranchExecution[] = [];

    for (const hint of hints) {
      if (!branchesById.has(hint.branchId.toUpperCase())) {
        diagnostics.push({
          severity: "warning",
          message: `Outcome hint ${hint.branchId} does not match any RISC-V branch.`
        });
      }
    }

    for (const branch of program.branches) {
      const hint = hintsByBranchId.get(branch.id);
      if (!hint || hint.outcomes.length === 0) {
        diagnostics.push({
          severity: "warning",
          message: `Branch ${branch.id} has no outcome hints; it will not be simulated.`
        });
        continue;
      }

      for (const actual of hint.outcomes) {
        executions.push({
          order: executions.length,
          branchId: branch.id,
          actual,
          address: branch.address,
          manualIndex: manualIndexesByBranchId.get(branch.id)
        });
      }
    }

    if (program.branches.length > 0 && hints.length === 0) {
      diagnostics.push({
        severity: "warning",
        message: "No branch outcome hints were available; static RISC-V cannot infer T/NT outcomes."
      });
    }

    return {
      branchSequence: {
        executions,
        loops: []
      },
      diagnostics
    };
  }
}
