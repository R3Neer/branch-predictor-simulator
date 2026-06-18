import type {
  BranchPredictor,
  MemoryMeasurable,
  PredictionResult,
  PredictorState,
  UpdateResult
} from "./BranchPredictor";
import { HistoryRegister } from "./HistoryRegister";
import { SaturatingCounter } from "./SaturatingCounter";
import type { OneLevelIndexPolicy } from "./OneLevelPredictor";
import type { BranchExecution } from "../simulation/BranchSequence";
import type { Outcome } from "../shared/Outcome";
import { LsbIndexer } from "../indexing/LsbIndexer";
import { ManualIndexer } from "../indexing/ManualIndexer";
import { assertPositiveInteger } from "../shared/BitString";

export interface TwoLevelConfig {
  readonly type: "two-level";
  readonly historyBits: number;
  readonly counterBits: number;
  readonly firstLevelEntries: number;
  readonly countersPerEntry: number;
  readonly historyScope?: "local" | "global";
  readonly initialHistoryValue: number;
  readonly initialCounterValue: number;
  readonly initialCounterValues?: readonly (readonly number[])[];
  readonly includeHistoryInMemory?: boolean;
  readonly indexPolicy: OneLevelIndexPolicy;
}

export interface TwoLevelState extends PredictorState {
  readonly type: "two-level";
  readonly histories: readonly HistoryRegister[];
  readonly globalHistory?: HistoryRegister;
  readonly counters: readonly (readonly SaturatingCounter[])[];
  readonly indexPolicy: OneLevelIndexPolicy;
}

export class TwoLevelPredictor
  implements BranchPredictor<TwoLevelConfig, TwoLevelState>, MemoryMeasurable<TwoLevelConfig>
{
  initialise(config: TwoLevelConfig): TwoLevelState {
    this.validateConfig(config);

    return {
      type: "two-level",
      indexPolicy: config.indexPolicy,
      histories: Array.from(
        { length: config.firstLevelEntries },
        () => new HistoryRegister(config.historyBits, config.initialHistoryValue)
      ),
      globalHistory:
        config.historyScope === "global"
          ? new HistoryRegister(config.historyBits, config.initialHistoryValue)
          : undefined,
      counters: Array.from({ length: config.firstLevelEntries }, (_row, rowIndex) =>
        Array.from({ length: config.countersPerEntry }, (_counter, counterIndex) =>
          new SaturatingCounter(
            config.counterBits,
            config.initialCounterValues?.[rowIndex]?.[counterIndex] ?? config.initialCounterValue
          )
        )
      )
    };
  }

  predict(execution: BranchExecution, state: TwoLevelState): PredictionResult<TwoLevelState> {
    const { firstIndex, counterIndex } = this.resolveIndexes(execution, state);
    const counter = state.counters[firstIndex][counterIndex];
    const history = state.globalHistory ?? state.histories[firstIndex];

    return {
      prediction: counter.predict(),
      stateBefore: state,
      trace: {
        selectedEntry: `${firstIndex}:${counterIndex}`,
        counterBefore: counter.toBits(),
        indexCalculation: {
          policy: "two-level",
          historyBits: history.toBits(),
          operation: state.globalHistory ? "first-level index + global history" : "first-level index + local history",
          resultIndex: `${firstIndex}:${counterIndex}`
        },
        compactExplanation: `Entry ${firstIndex} history ${history.toBits()} selects counter ${counterIndex}.`
      }
    };
  }

  update(
    execution: BranchExecution,
    actualOutcome: Outcome,
    state: TwoLevelState
  ): UpdateResult<TwoLevelState> {
    const { firstIndex, counterIndex } = this.resolveIndexes(execution, state);
    const before = state.counters[firstIndex][counterIndex];
    const after = before.update(actualOutcome);
    const counters = state.counters.map((row, rowIndex) =>
      rowIndex === firstIndex
        ? row.map((counter, index) => (index === counterIndex ? after : counter))
        : row
    );
    const histories = state.globalHistory
      ? state.histories
      : state.histories.map((history, index) =>
          index === firstIndex ? history.shiftIn(actualOutcome) : history
        );

    return {
      stateAfter: {
        ...state,
        counters,
        histories,
        globalHistory: state.globalHistory?.shiftIn(actualOutcome)
      },
      trace: { counterAfter: after.toBits(), saturationApplied: before.value === after.value }
    };
  }

  memoryUsage(config: TwoLevelConfig) {
    this.validateConfig(config);

    return {
      bits:
        (config.includeHistoryInMemory === false
          ? 0
          : config.historyScope === "global"
            ? config.historyBits
            : config.firstLevelEntries * config.historyBits) +
        config.firstLevelEntries * config.countersPerEntry * config.counterBits,
      entries: config.firstLevelEntries * config.countersPerEntry
    };
  }

  private resolveIndexes(execution: BranchExecution, state: TwoLevelState) {
    const firstIndex =
      state.indexPolicy.type === "manual"
        ? new ManualIndexer().resolveIndex(execution, state.indexPolicy).index
        : new LsbIndexer().resolveIndex(execution, state.indexPolicy).index;
    const history = state.globalHistory ?? state.histories[firstIndex];
    const counterIndex = history.value % state.counters[firstIndex].length;

    return { firstIndex, counterIndex };
  }

  private validateConfig(config: TwoLevelConfig): void {
    assertPositiveInteger(config.historyBits, "historyBits");
    assertPositiveInteger(config.counterBits, "counterBits");
    assertPositiveInteger(config.firstLevelEntries, "firstLevelEntries");
    assertPositiveInteger(config.countersPerEntry, "countersPerEntry");
    if (config.indexPolicy.entries !== config.firstLevelEntries) {
      throw new Error("indexPolicy.entries must match firstLevelEntries");
    }
    new HistoryRegister(config.historyBits, config.initialHistoryValue);
    new SaturatingCounter(config.counterBits, config.initialCounterValue);
    if (config.initialCounterValues !== undefined) {
      if (config.initialCounterValues.length !== config.firstLevelEntries) {
        throw new Error("initialCounterValues rows must match firstLevelEntries");
      }
      for (const row of config.initialCounterValues) {
        if (row.length !== config.countersPerEntry) {
          throw new Error("initialCounterValues columns must match countersPerEntry");
        }
        for (const value of row) {
          new SaturatingCounter(config.counterBits, value);
        }
      }
    }
  }
}
