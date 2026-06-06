import { describe, expect, it } from "vitest";
import { useSimulationStore } from "./simulationStore";

describe("simulationStore", () => {
  it("switches active predictor configuration when selecting a template variant", () => {
    const store = useSimulationStore.getState();

    store.selectTemplate("exercise-2-two-level");
    useSimulationStore.getState().step();
    expect(useSimulationStore.getState().currentStep).toBe(1);

    useSimulationStore.getState().selectVariant("two-level-1-2");

    expect(useSimulationStore.getState()).toMatchObject({
      selectedVariantId: "two-level-1-2",
      activeVariantTitle: "Predictor multinivel (1,2)",
      currentStep: 0,
      trace: []
    });
    expect(useSimulationStore.getState().activePredictorConfig).toMatchObject({
      type: "two-level",
      counterBits: 2,
      countersPerEntry: 2
    });
  });
});
