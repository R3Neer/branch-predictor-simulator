import type { StatisticsSet } from "../stats/StatsCalculator";
import type { TraceStep } from "../simulation/TraceStep";
import { StatAnswerParser } from "./StatAnswerParser";

export interface UserSolution {
  readonly tableAnswers: readonly TableAnswer[];
  readonly statAnswers: readonly StatAnswer[];
}

export interface TableAnswer {
  readonly step: number;
  readonly prediction?: string;
  readonly hit?: string;
  readonly counterAfter?: string;
}

export interface StatAnswer {
  readonly key: StatisticKey;
  readonly raw: string;
  readonly unit?: string;
}

export type StatisticKey =
  | "hits"
  | "misses"
  | "hitRate"
  | "missRate"
  | "memoryBits"
  | "usedEntries"
  | "aliasingEvents";

export interface CellCorrection {
  readonly step: number;
  readonly field: keyof Omit<TableAnswer, "step">;
  readonly expected: string;
  readonly actual: string | undefined;
  readonly correct: boolean;
}

export interface StatCorrection {
  readonly key: StatisticKey;
  readonly expected: number;
  readonly actual?: number;
  readonly correct: boolean;
  readonly message?: string;
}

export interface CorrectionSummary {
  readonly total: number;
  readonly correct: number;
}

export interface CorrectionReport {
  readonly tableResults: readonly CellCorrection[];
  readonly statResults: readonly StatCorrection[];
  readonly summary: CorrectionSummary;
}

export interface TolerancePolicy {
  readonly percentageMargin: number;
}

export class AnswerChecker {
  constructor(
    private readonly parser = new StatAnswerParser(),
    private readonly tolerance: TolerancePolicy = { percentageMargin: 0.005 }
  ) {}

  compare(
    solution: UserSolution,
    trace: readonly TraceStep[],
    stats: StatisticsSet
  ): CorrectionReport {
    const tableResults = solution.tableAnswers.flatMap((answer) =>
      this.compareTableAnswer(answer, trace)
    );
    const statResults = solution.statAnswers.map((answer) => this.compareStatAnswer(answer, stats));
    const total = tableResults.length + statResults.length;
    const correct =
      tableResults.filter((result) => result.correct).length +
      statResults.filter((result) => result.correct).length;

    return {
      tableResults,
      statResults,
      summary: { total, correct }
    };
  }

  private compareTableAnswer(answer: TableAnswer, trace: readonly TraceStep[]): CellCorrection[] {
    const step = trace.find((candidate) => candidate.step === answer.step);
    if (!step) {
      throw new Error(`trace step ${answer.step} does not exist`);
    }

    return [
      this.compareCell(answer, "prediction", step.prediction),
      this.compareCell(answer, "hit", step.hit ? "hit" : "miss"),
      this.compareCell(answer, "counterAfter", step.updateTrace.counterAfter ?? "")
    ].filter((result) => result.actual !== undefined);
  }

  private compareCell(
    answer: TableAnswer,
    field: keyof Omit<TableAnswer, "step">,
    expected: string
  ): CellCorrection {
    const actual = answer[field];
    return {
      step: answer.step,
      field,
      expected,
      actual,
      correct: actual?.trim().toLowerCase() === expected.toLowerCase()
    };
  }

  private compareStatAnswer(answer: StatAnswer, stats: StatisticsSet): StatCorrection {
    try {
      const parsed = this.parser.parse(answer.raw, answer.unit);
      const expected = this.expectedStat(answer.key, stats);
      const correct = this.isStatCorrect(answer.key, parsed.value, expected);

      return {
        key: answer.key,
        expected,
        actual: parsed.value,
        correct
      };
    } catch (error) {
      return {
        key: answer.key,
        expected: this.expectedStat(answer.key, stats),
        correct: false,
        message: error instanceof Error ? error.message : "invalid answer"
      };
    }
  }

  private expectedStat(key: StatisticKey, stats: StatisticsSet): number {
    const values: Record<StatisticKey, number | undefined> = {
      hits: stats.hits,
      misses: stats.misses,
      hitRate: stats.hitRate.value,
      missRate: stats.missRate.value,
      memoryBits: stats.memoryBits,
      usedEntries: stats.usedEntries,
      aliasingEvents: stats.aliasingEvents
    };
    const value = values[key];
    if (value === undefined) {
      throw new Error(`stat ${key} is not available`);
    }

    return value;
  }

  private isStatCorrect(key: StatisticKey, actual: number, expected: number): boolean {
    if (key === "hitRate" || key === "missRate") {
      return Math.abs(actual - expected) <= this.tolerance.percentageMargin;
    }

    return actual === expected;
  }
}
