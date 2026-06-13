import { describe, expect, it } from "vitest";
import type {
  BranchPredictor,
  PredictionResult,
  PredictorState,
  UpdateResult
} from "./BranchPredictor";
import { OneLevelPredictor } from "./OneLevelPredictor";
import { PredictorFactory, PredictorRegistry } from "./PredictorFactory";
import type { BranchExecution } from "../simulation/BranchSequence";
import type { Outcome } from "../shared/Outcome";

interface FakeConfig {
  readonly type: "fake";
  readonly initialPrediction: Outcome;
}

interface FakeState extends PredictorState {
  readonly type: "fake";
  readonly lastPrediction: Outcome;
}

class FakePredictor implements BranchPredictor<FakeConfig, FakeState> {
  initialise(config: FakeConfig): FakeState {
    return { type: "fake", lastPrediction: config.initialPrediction };
  }

  predict(_execution: BranchExecution, state: FakeState): PredictionResult<FakeState> {
    return {
      prediction: state.lastPrediction,
      stateBefore: state,
      trace: {
        selectedEntry: "fake",
        compactExplanation: "Fake predictor returns its configured outcome."
      }
    };
  }

  update(
    _execution: BranchExecution,
    actualOutcome: Outcome,
    state: FakeState
  ): UpdateResult<FakeState> {
    return {
      stateAfter: { ...state, lastPrediction: actualOutcome },
      trace: { saturationApplied: false }
    };
  }
}

describe("PredictorFactory", () => {
  it("creates built-in predictors from the default registry", () => {
    const predictor = new PredictorFactory().create({ type: "one-level" });

    expect(predictor).toBeInstanceOf(OneLevelPredictor);
  });

  it("keeps returning undefined for invalid or unknown configs", () => {
    const factory = new PredictorFactory();

    expect(factory.create(undefined)).toBeUndefined();
    expect(factory.create({})).toBeUndefined();
    expect(factory.create({ type: 1 })).toBeUndefined();
    expect(factory.create({ type: "not-registered" })).toBeUndefined();
  });

  it("creates predictors registered on an injected registry", () => {
    const registry = new PredictorRegistry().register({
      type: "fake",
      build: () => new FakePredictor()
    });
    const factory = new PredictorFactory(registry);

    const predictor = factory.create({ type: "fake", initialPrediction: "T" });

    expect(predictor).toBeInstanceOf(FakePredictor);
    expect(predictor?.initialise({ type: "fake", initialPrediction: "T" })).toEqual({
      type: "fake",
      lastPrediction: "T"
    });
  });

  it("creates predictors registered directly on a factory instance", () => {
    const factory = new PredictorFactory().register({
      type: "fake",
      build: () => new FakePredictor()
    });

    expect(factory.create({ type: "fake", initialPrediction: "NT" })).toBeInstanceOf(
      FakePredictor
    );
  });
});
