import type { TraceStep } from "../../domain/simulation/TraceStep";
import type { PredictorState } from "../../domain/predictors/BranchPredictor";

export type SessionMode = "exam" | "solution";
export type Language = "en";

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
  en: {
    iteration: "Iteration",
    branch: "Branch",
    firstLevelIndex: "First-level index",
    counterIndex: "Counter index",
    index: "Index",
    pcBits: "PC bits",
    historyBefore: "History before",
    historyAfter: "History after",
    indexOperation: "Index calculation",
    counterBefore: "Counter before",
    prediction: "Prediction",
    actual: "Actual",
    hit: "Hit",
    hitValue: "Hit",
    missValue: "Miss",
    counterAfter: "Counter after",
    aliasing: "Aliasing"
  }
};

const baseColumnIds = [
  "iteration",
  "branch",
  "index",
  "counterBefore",
  "prediction",
  "actual",
  "hit",
  "counterAfter"
] as const;

const optionalColumnIds = [
  "firstLevelIndex",
  "counterIndex",
  "pcBits",
  "historyBefore",
  "historyAfter",
  "indexOperation",
  "aliasing"
] as const;

export class TableProjector {
  project(trace: readonly TraceStep[], options: TableProjectorOptions): DynamicTableView {
    const solutionHidden = options.mode === "exam" && options.revealSolution !== true;
    const localizedLabels = labels[options.language];
    const rowCells = trace.map((step) => this.buildCells(step, solutionHidden, localizedLabels));
    const dynamicColumnIds = optionalColumnIds.filter((id) =>
      rowCells.some((cells) => cells[id]?.rawValue !== "")
    );
    const columns = [...baseColumnIds.slice(0, 2), ...dynamicColumnIds, ...baseColumnIds.slice(2)].map(
      (id) => ({ id, label: localizedLabels[id] })
    );

    return {
      columns,
      hiddenUntilRequested: solutionHidden,
      rows: trace.map((step, index) => ({
        id: String(step.step),
        cells: Object.fromEntries(
          columns.map((column) => [column.id, rowCells[index][column.id]?.cell ?? visible("")])
        )
      }))
    };
  }

  private buildCells(
    step: TraceStep,
    solutionHidden: boolean,
    localizedLabels: Record<string, string>
  ): Record<string, ProjectedCell> {
    const { firstLevelIndex, counterIndex } = splitSelectedEntry(step.predictionTrace.selectedEntry);
    const indexCalculation = step.predictionTrace.indexCalculation;
    const historyAfter = findHistoryAfter(step);
    const aliasing = step.updateTrace.aliasingEvent?.description ?? "";

    return {
      iteration: projected(String(step.step), false),
      branch: projected(String(step.branchExecution.branchId), false),
      firstLevelIndex: projected(firstLevelIndex, solutionHidden),
      counterIndex: projected(counterIndex, solutionHidden),
      index: projected(step.predictionTrace.selectedEntry, false),
      pcBits: projected(indexCalculation?.pcBits ?? "", solutionHidden),
      historyBefore: projected(indexCalculation?.historyBits ?? "", solutionHidden),
      historyAfter: projected(historyAfter, solutionHidden),
      indexOperation: projected(indexCalculation?.operation ?? "", solutionHidden),
      counterBefore: projected(step.predictionTrace.counterBefore ?? "", solutionHidden),
      prediction: projected(step.prediction, solutionHidden),
      actual: projected(step.actual, false),
      hit: projected(step.hit ? localizedLabels.hitValue : localizedLabels.missValue, solutionHidden),
      counterAfter: projected(step.updateTrace.counterAfter ?? "", solutionHidden),
      aliasing: projected(aliasing, solutionHidden)
    };
  }
}

function visible(value: string): TableCell {
  return { value, hidden: false };
}

function maybeHidden(value: string, hidden: boolean): TableCell {
  return { value: hidden ? "" : value, hidden };
}

interface ProjectedCell {
  readonly rawValue: string;
  readonly cell: TableCell;
}

function projected(value: string, hidden: boolean): ProjectedCell {
  return { rawValue: value, cell: maybeHidden(value, hidden) };
}

function splitSelectedEntry(selectedEntry: string): { firstLevelIndex: string; counterIndex: string } {
  const parts = selectedEntry.split(":");
  if (parts.length !== 2) {
    return { firstLevelIndex: "", counterIndex: "" };
  }

  return { firstLevelIndex: parts[0], counterIndex: parts[1] };
}

function findHistoryAfter(step: TraceStep): string {
  const { firstLevelIndex } = splitSelectedEntry(step.predictionTrace.selectedEntry);
  return historyBitsForState(step.stateAfter, firstLevelIndex);
}

function historyBitsForState(state: PredictorState, firstLevelIndex: string): string {
  if (hasGlobalHistory(state) && state.globalHistory !== undefined) {
    return state.globalHistory.toBits();
  }
  if (hasGhr(state)) {
    return state.ghr.toBits();
  }
  if (hasHistories(state) && firstLevelIndex !== "") {
    const index = Number(firstLevelIndex);
    return Number.isInteger(index) ? state.histories[index]?.toBits() ?? "" : "";
  }

  return "";
}

function hasGlobalHistory(state: PredictorState): state is PredictorState & {
  readonly globalHistory?: { toBits(): string };
} {
  return "globalHistory" in state;
}

function hasGhr(state: PredictorState): state is PredictorState & { readonly ghr: { toBits(): string } } {
  return "ghr" in state;
}

function hasHistories(state: PredictorState): state is PredictorState & {
  readonly histories: readonly { toBits(): string }[];
} {
  return "histories" in state;
}
