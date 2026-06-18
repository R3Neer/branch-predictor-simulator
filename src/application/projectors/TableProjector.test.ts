import { describe, expect, it } from "vitest";
import { GsharePredictor, type GshareConfig } from "../../domain/predictors/GsharePredictor";
import { OneLevelPredictor, type OneLevelConfig } from "../../domain/predictors/OneLevelPredictor";
import { TwoLevelPredictor, type TwoLevelConfig } from "../../domain/predictors/TwoLevelPredictor";
import { SimulationEngine } from "../../domain/simulation/SimulationEngine";
import { TableProjector } from "./TableProjector";

const config: OneLevelConfig = {
  type: "one-level",
  counterBits: 2,
  entries: 1,
  initialCounterValue: 1,
  indexPolicy: { type: "manual", entries: 1 }
};

describe("TableProjector", () => {
  it("hides solution-derived cells in exam mode until requested", () => {
    const trace = buildTrace();
    const view = new TableProjector().project(trace, { mode: "exam", language: "en" });

    expect(view.hiddenUntilRequested).toBe(true);
    expect(view.rows[0].cells.actual).toEqual({ value: "T", hidden: false });
    expect(view.rows[0].cells.prediction).toEqual({ value: "", hidden: true });
    expect(view.rows[0].cells.counterAfter).toEqual({ value: "", hidden: true });
  });

  it("shows all cells in solution mode", () => {
    const trace = buildTrace();
    const view = new TableProjector().project(trace, { mode: "solution", language: "en" });

    expect(view.hiddenUntilRequested).toBe(false);
    expect(view.columns.map((column) => column.label)).toContain("Prediction");
    expect(view.rows[0].cells.prediction).toEqual({ value: "NT", hidden: false });
    expect(view.rows[0].cells.hit).toEqual({ value: "Miss", hidden: false });
  });

  it("projects two-level history and split indexes from the canonical trace", () => {
    const trace = buildTwoLevelTrace();
    const view = new TableProjector().project(trace, { mode: "solution", language: "en" });

    expect(view.columns.map((column) => column.id)).toEqual([
      "iteration",
      "branch",
      "firstLevelIndex",
      "counterIndex",
      "historyBefore",
      "historyAfter",
      "indexOperation",
      "index",
      "counterBefore",
      "prediction",
      "actual",
      "hit",
      "counterAfter"
    ]);
    expect(view.rows[0].cells.firstLevelIndex).toEqual({ value: "1", hidden: false });
    expect(view.rows[0].cells.counterIndex).toEqual({ value: "0", hidden: false });
    expect(view.rows[0].cells.historyBefore).toEqual({ value: "0", hidden: false });
    expect(view.rows[0].cells.historyAfter).toEqual({ value: "1", hidden: false });
  });

  it("hides richer solution-derived columns in exam mode", () => {
    const trace = buildTwoLevelTrace();
    const view = new TableProjector().project(trace, { mode: "exam", language: "en" });

    expect(view.columns.map((column) => column.id)).toContain("historyBefore");
    expect(view.rows[0].cells.firstLevelIndex).toEqual({ value: "", hidden: true });
    expect(view.rows[0].cells.historyBefore).toEqual({ value: "", hidden: true });
    expect(view.rows[0].cells.indexOperation).toEqual({ value: "", hidden: true });
  });

  it("projects global indexed calculation details for gshare", () => {
    const trace = buildGshareTrace();
    const view = new TableProjector().project(trace, { mode: "solution", language: "en" });

    expect(view.columns.map((column) => column.id)).toContain("pcBits");
    expect(view.rows[0].cells.pcBits).toEqual({ value: "10", hidden: false });
    expect(view.rows[0].cells.historyBefore).toEqual({ value: "01", hidden: false });
    expect(view.rows[0].cells.historyAfter).toEqual({ value: "11", hidden: false });
    expect(view.rows[0].cells.indexOperation).toEqual({ value: "pc xor history", hidden: false });
  });
});

function buildTrace() {
  const predictor = new OneLevelPredictor();
  const engine = new SimulationEngine();
  return engine.runToCompletion(
    engine.initialise(
      {
        executions: [{ order: 0, branchId: "B1", actual: "T", manualIndex: 0 }],
        loops: []
      },
      predictor,
      config
    ),
    predictor
  ).trace;
}

function buildTwoLevelTrace() {
  const predictor = new TwoLevelPredictor();
  const engine = new SimulationEngine();
  const twoLevelConfig: TwoLevelConfig = {
    type: "two-level",
    historyBits: 1,
    counterBits: 2,
    firstLevelEntries: 2,
    countersPerEntry: 2,
    initialHistoryValue: 0,
    initialCounterValue: 1,
    indexPolicy: { type: "manual", entries: 2 }
  };

  return engine.runToCompletion(
    engine.initialise(
      {
        executions: [{ order: 0, branchId: "B1", actual: "T", manualIndex: 1 }],
        loops: []
      },
      predictor,
      twoLevelConfig
    ),
    predictor
  ).trace;
}

function buildGshareTrace() {
  const predictor = new GsharePredictor();
  const engine = new SimulationEngine();
  const gshareConfig: GshareConfig = {
    type: "gshare",
    ghrBits: 2,
    phtEntries: 4,
    counterBits: 2,
    initialGhrValue: 1,
    initialCounterValue: 1,
    pcBits: 2,
    ghrBitsUsed: 2
  };

  return engine.runToCompletion(
    engine.initialise(
      {
        executions: [{ order: 0, branchId: "B1", actual: "T", address: 0b10 }],
        loops: []
      },
      predictor,
      gshareConfig
    ),
    predictor
  ).trace;
}
