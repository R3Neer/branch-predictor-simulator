import { describe, expect, it } from "vitest";
import { OneLevelPredictor, type OneLevelConfig } from "../../domain/predictors/OneLevelPredictor";
import { SimulationEngine } from "../../domain/simulation/SimulationEngine";
import { CalculationViewBuilder } from "./CalculationViewBuilder";

const config: OneLevelConfig = {
  type: "one-level",
  counterBits: 2,
  entries: 1,
  initialCounterValue: 1,
  indexPolicy: { type: "manual", entries: 1 }
};

describe("CalculationViewBuilder", () => {
  it("builds compact and expanded calculation views from trace", () => {
    const predictor = new OneLevelPredictor();
    const engine = new SimulationEngine();
    const step = engine.runToCompletion(
      engine.initialise(
        {
          executions: [{ order: 0, branchId: "B1", actual: "T", manualIndex: 0 }],
          loops: []
        },
        predictor,
        config
      ),
      predictor
    ).trace[0];
    const builder = new CalculationViewBuilder();

    expect(builder.compact(step)).toMatchObject({ expandedByDefault: false });
    expect(builder.expanded(step).sections.map((section) => section.title)).toEqual([
      "Index",
      "Counter"
    ]);
  });
});
