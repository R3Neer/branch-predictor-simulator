import type { TraceStep } from "../../domain/simulation/TraceStep";

export interface CalculationSection {
  readonly title: string;
  readonly rows: readonly CalculationRow[];
}

export interface CalculationRow {
  readonly label: string;
  readonly valueBefore?: string;
  readonly operation: string;
  readonly valueAfter?: string;
}

export interface CalculationView {
  readonly summary: string;
  readonly sections: readonly CalculationSection[];
  readonly expandedByDefault: boolean;
}

export class CalculationViewBuilder {
  compact(step: TraceStep): CalculationView {
    return {
      summary: step.predictionTrace.compactExplanation,
      sections: [],
      expandedByDefault: false
    };
  }

  expanded(step: TraceStep): CalculationView {
    return {
      summary: step.predictionTrace.compactExplanation,
      expandedByDefault: true,
      sections: [
        {
          title: "Index",
          rows: [
            {
              label: step.predictionTrace.indexCalculation?.policy ?? "unknown",
              valueBefore: step.predictionTrace.indexCalculation?.pcBits,
              operation: step.predictionTrace.indexCalculation?.operation ?? "",
              valueAfter: step.predictionTrace.indexCalculation?.resultIndex
            }
          ]
        },
        {
          title: "Counter",
          rows: [
            {
              label: step.branchExecution.branchId,
              valueBefore: step.predictionTrace.counterBefore,
              operation: step.actual === "T" ? "increment" : "decrement",
              valueAfter: step.updateTrace.counterAfter
            }
          ]
        }
      ]
    };
  }
}
