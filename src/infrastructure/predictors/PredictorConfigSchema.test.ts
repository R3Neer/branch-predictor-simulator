import { describe, expect, it } from "vitest";
import { predictorConfigSchema } from "./PredictorConfigSchema";

describe("predictorConfigSchema", () => {
  it("accepts v1 predictor config shapes", () => {
    const configs = [
      {
        type: "one-level",
        counterBits: 2,
        entries: 1,
        initialCounterValue: 1,
        indexPolicy: { type: "manual", entries: 1 }
      },
      {
        type: "two-level",
        historyBits: 2,
        counterBits: 2,
        firstLevelEntries: 1,
        countersPerEntry: 4,
        historyScope: "global",
        initialHistoryValue: 0,
        initialCounterValue: 1,
        initialCounterValues: [[0, 1, 2, 3]],
        includeHistoryInMemory: false,
        indexPolicy: { type: "manual", entries: 1 }
      },
      {
        type: "global-correlated",
        ghrBits: 2,
        phtEntries: 4,
        counterBits: 2,
        initialGhrValue: 0,
        initialCounterValue: 1
      },
      {
        type: "gshare",
        ghrBits: 2,
        ghrBitsUsed: 2,
        pcBits: 2,
        phtEntries: 4,
        counterBits: 2,
        initialGhrValue: 0,
        initialCounterValue: 1
      },
      {
        type: "gselect",
        ghrBits: 2,
        ghrBitsUsed: 2,
        pcBits: 2,
        phtEntries: 16,
        counterBits: 2,
        initialGhrValue: 0,
        initialCounterValue: 1
      },
      {
        type: "local-correlated",
        localHistoryBits: 2,
        localHistoryTableEntries: 2,
        localPredictionTableEntries: 4,
        counterBits: 2,
        initialLocalHistoryValue: 0,
        initialCounterValue: 1,
        indexPolicy: { type: "manual", entries: 2 }
      }
    ];

    for (const config of configs) {
      expect(() => predictorConfigSchema.parse(config)).not.toThrow();
    }
  });

  it("rejects unknown fields and invalid cross-field invariants", () => {
    expect(() =>
      predictorConfigSchema.parse({
        type: "one-level",
        counterBits: 2,
        entries: 1,
        initialCounterValue: 4,
        indexPolicy: { type: "manual", entries: 1 },
        extra: true
      })
    ).toThrow();

    expect(() =>
      predictorConfigSchema.parse({
        type: "gshare",
        ghrBits: 2,
        ghrBitsUsed: 3,
        pcBits: 2,
        phtEntries: 4,
        counterBits: 2,
        initialGhrValue: 0,
        initialCounterValue: 1
      })
    ).toThrow();

    expect(() =>
      predictorConfigSchema.parse({
        type: "two-level",
        historyBits: 1,
        counterBits: 1,
        firstLevelEntries: 2,
        countersPerEntry: 2,
        initialHistoryValue: 0,
        initialCounterValue: 0,
        initialCounterValues: [[0, 1]],
        indexPolicy: { type: "manual", entries: 2 }
      })
    ).toThrow();
  });
});
