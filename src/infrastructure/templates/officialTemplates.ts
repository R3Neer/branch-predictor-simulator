import type { OfficialTemplate } from "./OfficialTemplate";

export const officialTemplates: readonly OfficialTemplate[] = [
  {
    id: "exercise-1-one-level-2bit",
    exerciseNumber: 1,
    verificationStatus: "verified",
    title: "Exercise 1: 2-bit predictor",
    source: "ref_docs/Problems.pdf",
    pdfReference: "EC Problems - Predictors, exercise 1, page 1",
    statement:
      "Code with a single branch. Initial state 10 and outcomes NT-T-NT-NT-T-T.",
    branchSequence: {
      executions: outcomes(["NT", "T", "NT", "NT", "T", "T"]).map((actual, order) => ({
        order,
        branchId: "B1",
        actual,
        manualIndex: 0
      })),
      loops: []
    },
    variants: [
      {
        id: "one-level-2bit",
        title: "2-bit predictor",
        initialState: "B1 counter = 10",
        officialSolution: {
          summary: "Official table: 1 hit and 5 misses; final state 10."
        },
        predictorConfig: {
          type: "one-level",
          counterBits: 2,
          entries: 1,
          initialCounterValue: 2,
          indexPolicy: { type: "manual", entries: 1 }
        },
        expectedStatistics: { hits: 1, misses: 5, hitRate: 1 / 6, missRate: 5 / 6 }
      }
    ]
  },
  {
    id: "exercise-2-two-level",
    exerciseNumber: 2,
    verificationStatus: "verified",
    title: "Exercise 2: two-level (1,1) and (1,2)",
    source: "ref_docs/Problems.pdf",
    pdfReference: "EC Problems - Predictors, exercise 2, pages 1-2",
    statement:
      "B1/B2/B3 sequence after repeatedly being taken. Compare predictors (1,1) and (1,2).",
    branchSequence: {
      executions: outcomes(["NT", "T", "NT", "T", "NT", "T", "NT", "T", "NT", "T", "NT", "T", "NT", "T", "NT"]).map(
        (actual, order) => ({
          order,
          branchId: `B${(order % 3) + 1}`,
          actual,
          manualIndex: order % 3
        })
      ),
      loops: []
    },
    variants: [
      {
        id: "two-level-1-1",
        title: "Two-level predictor (1,1)",
        initialState: "P1 stabilized as taken after repeated executions; initial P0 follows the statement.",
        officialSolution: {
          summary: "Official solution: 6 misses out of 15, miss rate 40%."
        },
        predictorConfig: {
          type: "two-level",
          historyBits: 1,
          counterBits: 1,
          firstLevelEntries: 3,
          countersPerEntry: 2,
          initialHistoryValue: 1,
          initialCounterValue: 1,
          initialCounterValues: [
            [0, 0],
            [0, 0],
            [0, 1]
          ],
          indexPolicy: { type: "manual", entries: 3 }
        },
        expectedStatistics: { hits: 9, misses: 6, hitRate: 9 / 15, missRate: 6 / 15 }
      },
      {
        id: "two-level-1-2",
        title: "Two-level predictor (1,2)",
        initialState: "P1 stabilized as strongly taken; P0 follows the official table.",
        officialSolution: {
          summary: "Official solution: 12 misses out of 15, miss rate 80%."
        },
        predictorConfig: {
          type: "two-level",
          historyBits: 1,
          counterBits: 2,
          firstLevelEntries: 3,
          countersPerEntry: 2,
          initialHistoryValue: 1,
          initialCounterValue: 3,
          initialCounterValues: [
            [0, 3],
            [0, 3],
            [0, 3]
          ],
          indexPolicy: { type: "manual", entries: 3 }
        },
        expectedStatistics: { hits: 3, misses: 12, hitRate: 3 / 15, missRate: 12 / 15 }
      }
    ]
  },
  {
    id: "exercise-3-two-level-3-2",
    exerciseNumber: 3,
    verificationStatus: "verified",
    title: "Exercise 3: (3,2) predictor, 512 entries, 9 LSBs",
    source: "ref_docs/Problems.pdf",
    pdfReference: "EC Problems - Predictors, exercise 3, pages 2-3",
    statement:
      "Predictor (3,2) with 512 entries and direct access using 9 LSBs. No aliasing between B1 and B2.",
    branchSequence: {
      executions: outcomes(["NT", "T", "NT", "T", "NT", "T", "NT", "T", "NT", "T", "NT", "T", "T", "T", "NT"]).map(
        (actual, order) => ({
          order,
          branchId: orderSequence(["B1", "B2", "B2", "B1", "B2", "B1", "B1", "B1", "B2", "B1", "B2", "B2", "B1", "B2", "B2"], order),
          actual,
          address: orderSequence([0x101, 0x202, 0x202, 0x101, 0x202, 0x101, 0x101, 0x101, 0x202, 0x101, 0x202, 0x202, 0x101, 0x202, 0x202], order)
        })
      ),
      loops: []
    },
    variants: [
      {
        id: "two-level-3-2-512",
        title: "Predictor (3,2)",
        initialState: "GHR = 000; all counters = 01.",
        officialSolution: {
          summary: "Official solution: error rate 5/15; memory 512 * 8 * 2 = 8192 bits."
        },
        predictorConfig: {
          type: "two-level",
          historyBits: 3,
          counterBits: 2,
          firstLevelEntries: 512,
          countersPerEntry: 8,
          historyScope: "global",
          initialHistoryValue: 0,
          initialCounterValue: 1,
          includeHistoryInMemory: false,
          indexPolicy: { type: "lsb", entries: 512, addressBits: 9 }
        },
        expectedStatistics: {
          hits: 10,
          misses: 5,
          hitRate: 10 / 15,
          missRate: 5 / 15,
          memoryBits: 8192,
          notes: "Official memory: 1 kB."
        }
      }
    ]
  },
  {
    id: "exercise-4-global-correlated-2-2",
    exerciseNumber: 4,
    verificationStatus: "verified",
    title: "Exercise 4: correlated (2,2) with B1/B2",
    source: "ref_docs/Problems.pdf",
    pdfReference: "EC Problems - Predictors, exercise 4, pages 3-4",
    statement:
      "Fragment with branches B1 and B2, initial GHR 11, and entries initially 11.",
    branchSequence: {
      executions: outcomes(["NT", "T", "T", "T", "NT", "T", "T", "T", "NT", "T", "NT", "NT"]).map(
        (actual, order) => ({
          order,
          branchId: order % 2 === 0 ? "B1" : "B2",
          actual,
          manualIndex: order % 2
        })
      ),
      loops: []
    },
    variants: [
      {
        id: "global-correlated-2-2",
        title: "Correlated (2,2)",
        initialState: "GHR = 11; all prediction entries = 11.",
        officialSolution: {
          summary: "Official solution: 4 misses out of 12."
        },
        predictorConfig: {
          type: "two-level",
          historyBits: 2,
          counterBits: 2,
          firstLevelEntries: 2,
          countersPerEntry: 4,
          historyScope: "global",
          initialHistoryValue: 3,
          initialCounterValue: 3,
          indexPolicy: { type: "manual", entries: 2 }
        },
        expectedStatistics: { hits: 8, misses: 4, hitRate: 8 / 12, missRate: 4 / 12 }
      }
    ]
  },
  {
    id: "exercise-5-gshare",
    exerciseNumber: 5,
    verificationStatus: "verified",
    title: "Exercise 5: gshare",
    source: "ref_docs/Problems.pdf",
    pdfReference: "EC Problems - Predictors, exercise 5, pages 4-5",
    statement:
      "gshare predictor with 256 2-bit predictors, initial GHR NT, and branch at 0x54.",
    branchSequence: {
      executions: outcomes([...Array.from({ length: 15 }, () => "T"), "NT"]).map((actual, order) => ({
        order,
        branchId: "B1",
        actual,
        address: 0x54
      })),
      loops: []
    },
    variants: [
      {
        id: "gshare-256-2bit",
        title: "gshare 256 entries",
        initialState: "GHR = 00000000; all predictors = NT (00).",
        officialSolution: {
          summary: "Official solution: 9 second-level predictors used, 11 misses and 5 hits."
        },
        predictorConfig: {
          type: "gshare",
          ghrBits: 8,
          ghrBitsUsed: 8,
          pcBits: 8,
          phtEntries: 256,
          counterBits: 2,
          initialGhrValue: 0,
          initialCounterValue: 0
        },
        expectedStatistics: { hits: 5, misses: 11, hitRate: 5 / 16, missRate: 11 / 16, usedEntries: 9 }
      }
    ]
  },
  {
    id: "exercise-7-pattern-ttn",
    exerciseNumber: 7,
    verificationStatus: "verified",
    title: "Exercise 7: T-T-NT pattern with predictor (2,2)",
    source: "ref_docs/Problems.pdf",
    pdfReference: "EC Problems - Predictors, exercise 7, page 6",
    statement:
      "Branch with T-T-NT pattern using a dynamic (2,2) predictor, structures initialized to zero.",
    branchSequence: {
      executions: outcomes(["T", "T", "NT", "T", "T", "NT", "T", "T", "NT", "T", "T", "NT", "T"]).map(
        (actual, order) => ({ order, branchId: "B1", actual, manualIndex: 0 })
      ),
      loops: []
    },
    variants: [
      {
        id: "two-level-2-2-single-pattern",
        title: "Predictor (2,2)",
        initialState: "All structures and registers initialized to 0.",
        officialSolution: {
          summary: "The official solution states that it always hits from execution 8 onward.",
          stableFromStep: 8
        },
        predictorConfig: {
          type: "two-level",
          historyBits: 2,
          counterBits: 2,
          firstLevelEntries: 1,
          countersPerEntry: 4,
          initialHistoryValue: 0,
          initialCounterValue: 0,
          indexPolicy: { type: "manual", entries: 1 }
        },
        expectedStatistics: {
          hits: 8,
          misses: 5,
          hitRate: 8 / 13,
          missRate: 5 / 13,
          notes: "The official solution states stable hits from execution 8 onward."
        }
      }
    ]
  }
];

function outcomes(values: readonly string[]) {
  return values.map((value) => {
    if (value !== "T" && value !== "NT") {
      throw new Error(`invalid outcome ${value}`);
    }
    return value;
  });
}

function orderSequence<T>(values: readonly T[], order: number): T {
  return values[order];
}
