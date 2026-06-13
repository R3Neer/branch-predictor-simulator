import { describe, expect, it } from "vitest";
import { SimulationSessionService, type SessionYamlPort } from "./SimulationSessionService";
import type { BranchSequence } from "../domain/simulation/BranchSequence";

const yamlPort: SessionYamlPort = {
  toYaml: () => "yaml",
  fromYaml: () => {
    throw new Error("not needed");
  }
};

const service = new SimulationSessionService({
  sessionYamlMapper: yamlPort,
  tableExporters: {
    csv: { export: () => "csv" },
    markdown: { export: () => "markdown" }
  }
});

const loopedSequence: BranchSequence = {
  executions: [
    { order: 0, branchId: "B1", actual: "T", manualIndex: 0 },
    { order: 1, branchId: "B1", actual: "NT", manualIndex: 0 }
  ],
  loops: [{ startOrder: 0, endOrder: 1, repetitions: 3 }]
};

describe("SimulationSessionService", () => {
  it("translates supported C loops into a branch sequence", () => {
    const result = service.translateCToBranchSequence(
      "int a = 10; int i = 0; for (; i < 3; i++) a += i;"
    );

    expect(result.riscVSource).toContain("B1: exit loop");
    expect(result.branchSequence.executions.map((execution) => execution.actual)).toEqual([
      "NT",
      "NT",
      "NT",
      "T"
    ]);
  });

  it("runs branch sequences through the canonical engine with expanded loops", () => {
    const trace = service.runTrace(loopedSequence, {
      type: "one-level",
      counterBits: 1,
      entries: 1,
      initialCounterValue: 0,
      indexPolicy: { type: "manual", entries: 1 }
    });

    expect(service.expandedLength(loopedSequence)).toBe(6);
    expect(trace).toHaveLength(6);
  });

  it("checks statistic answers from trace-derived statistics", () => {
    const trace = service.runTrace(loopedSequence, {
      type: "one-level",
      counterBits: 1,
      entries: 1,
      initialCounterValue: 0,
      indexPolicy: { type: "manual", entries: 1 }
    });

    const report = service.checkStatAnswers(
      {
        hits: "0",
        misses: "",
        hitRate: "",
        missRate: "",
        memoryBits: "",
        usedEntries: "",
        aliasingEvents: ""
      },
      trace,
      {
        type: "one-level",
        counterBits: 1,
        entries: 1,
        initialCounterValue: 0,
        indexPolicy: { type: "manual", entries: 1 }
      }
    );

    expect(report.summary).toEqual({ total: 1, correct: 0 });
  });
});
