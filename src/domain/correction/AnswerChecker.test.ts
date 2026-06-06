import { describe, expect, it } from "vitest";
import { OneLevelPredictor, type OneLevelConfig } from "../predictors/OneLevelPredictor";
import { SimulationEngine } from "../simulation/SimulationEngine";
import { StatsCalculator } from "../stats/StatsCalculator";
import { AnswerChecker } from "./AnswerChecker";

const config: OneLevelConfig = {
  type: "one-level",
  counterBits: 2,
  entries: 1,
  initialCounterValue: 1,
  indexPolicy: { type: "manual", entries: 1 }
};

describe("AnswerChecker", () => {
  it("checks table answers and equivalent statistic formats", () => {
    const predictor = new OneLevelPredictor();
    const engine = new SimulationEngine();
    const run = engine.runToCompletion(
      engine.initialise(
        {
          executions: [
            { order: 0, branchId: "B1", actual: "T", manualIndex: 0 },
            { order: 1, branchId: "B1", actual: "T", manualIndex: 0 }
          ],
          loops: []
        },
        predictor,
        config
      ),
      predictor
    );
    const stats = new StatsCalculator().calculate(run.trace, predictor.memoryUsage(config));
    const report = new AnswerChecker().compare(
      {
        tableAnswers: [{ step: 1, prediction: "NT", hit: "miss", counterAfter: "10" }],
        statAnswers: [
          { key: "hits", raw: "1" },
          { key: "hitRate", raw: "1/2" },
          { key: "memoryBits", raw: "2 bits", unit: "bits" }
        ]
      },
      run.trace,
      stats
    );

    expect(report.summary).toEqual({ total: 6, correct: 6 });
  });

  it("marks incorrect answers without recalculating from UI data", () => {
    const predictor = new OneLevelPredictor();
    const engine = new SimulationEngine();
    const run = engine.runToCompletion(
      engine.initialise(
        {
          executions: [{ order: 0, branchId: "B1", actual: "T", manualIndex: 0 }],
          loops: []
        },
        predictor,
        config
      ),
      predictor
    );
    const stats = new StatsCalculator().calculate(run.trace);
    const report = new AnswerChecker().compare(
      {
        tableAnswers: [{ step: 1, prediction: "T" }],
        statAnswers: [{ key: "missRate", raw: "0%" }]
      },
      run.trace,
      stats
    );

    expect(report.summary).toEqual({ total: 2, correct: 0 });
  });
});
