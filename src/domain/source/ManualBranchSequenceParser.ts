import type { BranchExecution, BranchSequence, LoopRange } from "../simulation/BranchSequence";
import type { Outcome } from "../shared/Outcome";

const outcomeValues = new Set(["T", "NT"]);

export class ManualBranchSequenceParser {
  parse(source: string): BranchSequence {
    const executions: BranchExecution[] = [];
    const loops: LoopRange[] = [];

    source.split(/\r?\n/).forEach((rawLine, lineIndex) => {
      const lineNumber = lineIndex + 1;
      const [bodyPart, commentPart] = rawLine.split("#", 2);
      const body = bodyPart.trim();
      if (body.length === 0) {
        return;
      }

      const tokens = body.split(/\s+/);
      const command = tokens[0].toLowerCase();
      if (command === "loop" || command === "repeat") {
        loops.push(this.parseLoop(tokens, lineNumber));
        return;
      }

      executions.push(this.parseExecution(tokens, commentPart?.trim(), executions.length, lineNumber));
    });

    return { executions, loops };
  }

  format(sequence: BranchSequence): string {
    const executionLines = sequence.executions.map((execution) => {
      const parts = [execution.branchId, execution.actual];
      if (execution.manualIndex !== undefined) {
        parts.push(`index=${execution.manualIndex}`);
      }
      if (execution.address !== undefined) {
        parts.push(`address=${formatAddress(execution.address)}`);
      }
      const body = parts.join(" ");
      return execution.comment ? `${body} # ${execution.comment}` : body;
    });
    const loopLines = sequence.loops.map(
      (loop) => `loop ${loop.startOrder}..${loop.endOrder} x${loop.repetitions}`
    );

    return [...executionLines, ...loopLines].join("\n");
  }

  private parseExecution(
    tokens: readonly string[],
    comment: string | undefined,
    order: number,
    lineNumber: number
  ): BranchExecution {
    if (tokens.length < 2) {
      throw new Error(`line ${lineNumber}: expected branch id and outcome`);
    }

    const [branchId, rawOutcome, ...optionTokens] = tokens;
    const actual = rawOutcome.toUpperCase();
    if (!outcomeValues.has(actual)) {
      throw new Error(`line ${lineNumber}: outcome must be T or NT`);
    }

    const options = this.parseOptions(optionTokens, lineNumber);
    return {
      order,
      branchId,
      actual: actual as Outcome,
      manualIndex: options.manualIndex,
      address: options.address,
      comment
    };
  }

  private parseLoop(tokens: readonly string[], lineNumber: number): LoopRange {
    if (tokens.length !== 3) {
      throw new Error(`line ${lineNumber}: expected loop start..end xrepetitions`);
    }

    const rangeMatch = tokens[1].match(/^(\d+)\.\.(\d+)$/);
    const repetitionsMatch = tokens[2].match(/^x?(\d+)$/i);
    if (!rangeMatch || !repetitionsMatch) {
      throw new Error(`line ${lineNumber}: invalid loop range`);
    }

    const startOrder = Number(rangeMatch[1]);
    const endOrder = Number(rangeMatch[2]);
    const repetitions = Number(repetitionsMatch[1]);
    if (endOrder < startOrder) {
      throw new Error(`line ${lineNumber}: loop end must be greater than or equal to start`);
    }
    if (repetitions <= 0) {
      throw new Error(`line ${lineNumber}: loop repetitions must be positive`);
    }

    return { startOrder, endOrder, repetitions };
  }

  private parseOptions(tokens: readonly string[], lineNumber: number) {
    const options: { manualIndex?: number; address?: number } = {};
    for (const token of tokens) {
      const [rawKey, rawValue] = token.split("=", 2);
      if (!rawKey || rawValue === undefined) {
        throw new Error(`line ${lineNumber}: invalid option ${token}`);
      }

      const key = rawKey.toLowerCase();
      if (key === "index" || key === "manualindex" || key === "i") {
        options.manualIndex = parseNonNegativeInteger(rawValue, lineNumber, rawKey);
      } else if (key === "address" || key === "addr") {
        options.address = parseNonNegativeInteger(rawValue, lineNumber, rawKey);
      } else {
        throw new Error(`line ${lineNumber}: unknown option ${rawKey}`);
      }
    }

    return options;
  }
}

function parseNonNegativeInteger(raw: string, lineNumber: number, key: string): number {
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`line ${lineNumber}: ${key} must be a non-negative integer`);
  }

  return value;
}

function formatAddress(address: number): string {
  return `0x${address.toString(16)}`;
}
