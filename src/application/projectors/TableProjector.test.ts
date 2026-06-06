import { describe, expect, it } from "vitest";
import { OneLevelPredictor, type OneLevelConfig } from "../../domain/predictors/OneLevelPredictor";
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
    const view = new TableProjector().project(trace, { mode: "exam", language: "es" });

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
