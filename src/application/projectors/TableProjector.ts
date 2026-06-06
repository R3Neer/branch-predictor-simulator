import type { TraceStep } from "../../domain/simulation/TraceStep";

export type SessionMode = "exam" | "solution";
export type Language = "es" | "en";

export interface TableProjectorOptions {
  readonly mode: SessionMode;
  readonly language: Language;
  readonly revealSolution?: boolean;
}

export interface TableColumn {
  readonly id: string;
  readonly label: string;
}

export interface TableCell {
  readonly value: string;
  readonly hidden: boolean;
}

export interface TableRow {
  readonly id: string;
  readonly cells: Readonly<Record<string, TableCell>>;
}

export interface DynamicTableView {
  readonly columns: readonly TableColumn[];
  readonly rows: readonly TableRow[];
  readonly hiddenUntilRequested: boolean;
}

const labels: Record<Language, Record<string, string>> = {
  es: {
    iteration: "Iteracion",
    branch: "Salto",
    index: "Indice",
    counterBefore: "Contador antes",
    prediction: "Prediccion",
    actual: "Real",
    hit: "Acierto",
    counterAfter: "Contador despues"
  },
  en: {
    iteration: "Iteration",
    branch: "Branch",
    index: "Index",
    counterBefore: "Counter before",
    prediction: "Prediction",
    actual: "Actual",
    hit: "Hit",
    counterAfter: "Counter after"
  }
};

export class TableProjector {
  project(trace: readonly TraceStep[], options: TableProjectorOptions): DynamicTableView {
    const solutionHidden = options.mode === "exam" && options.revealSolution !== true;
    const columns = [
      "iteration",
      "branch",
      "index",
      "counterBefore",
      "prediction",
      "actual",
      "hit",
      "counterAfter"
    ].map((id) => ({ id, label: labels[options.language][id] }));

    return {
      columns,
      hiddenUntilRequested: solutionHidden,
      rows: trace.map((step) => ({
        id: String(step.step),
        cells: {
          iteration: visible(String(step.step)),
          branch: visible(String(step.branchExecution.branchId)),
          index: visible(step.predictionTrace.selectedEntry),
          counterBefore: maybeHidden(step.predictionTrace.counterBefore ?? "", solutionHidden),
          prediction: maybeHidden(step.prediction, solutionHidden),
          actual: visible(step.actual),
          hit: maybeHidden(step.hit ? labels[options.language].hit : "Miss", solutionHidden),
          counterAfter: maybeHidden(step.updateTrace.counterAfter ?? "", solutionHidden)
        }
      }))
    };
  }
}

function visible(value: string): TableCell {
  return { value, hidden: false };
}

function maybeHidden(value: string, hidden: boolean): TableCell {
  return { value: hidden ? "" : value, hidden };
}
