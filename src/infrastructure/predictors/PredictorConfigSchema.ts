import { z } from "zod";

const positiveIntegerSchema = z.number().int().positive();
const nonNegativeIntegerSchema = z.number().int().nonnegative();

const manualIndexPolicySchema = z
  .object({
    type: z.literal("manual"),
    entries: positiveIntegerSchema
  })
  .strict();

const lsbIndexPolicySchema = z
  .object({
    type: z.literal("lsb"),
    entries: positiveIntegerSchema,
    addressBits: positiveIntegerSchema.max(32),
    ignoreLowBits: nonNegativeIntegerSchema.optional()
  })
  .strict();

const indexPolicySchema = z.discriminatedUnion("type", [
  manualIndexPolicySchema,
  lsbIndexPolicySchema
]);

const oneLevelPredictorConfigSchema = z
  .object({
    type: z.literal("one-level"),
    counterBits: positiveIntegerSchema,
    entries: positiveIntegerSchema,
    initialCounterValue: nonNegativeIntegerSchema,
    indexPolicy: indexPolicySchema
  })
  .strict();

const twoLevelPredictorConfigSchema = z
  .object({
    type: z.literal("two-level"),
    historyBits: positiveIntegerSchema,
    counterBits: positiveIntegerSchema,
    firstLevelEntries: positiveIntegerSchema,
    countersPerEntry: positiveIntegerSchema,
    historyScope: z.union([z.literal("local"), z.literal("global")]).optional(),
    initialHistoryValue: nonNegativeIntegerSchema,
    initialCounterValue: nonNegativeIntegerSchema,
    initialCounterValues: z.array(z.array(nonNegativeIntegerSchema)).optional(),
    includeHistoryInMemory: z.boolean().optional(),
    indexPolicy: indexPolicySchema
  })
  .strict();

const globalCorrelatedPredictorConfigSchema = z
  .object({
    type: z.literal("global-correlated"),
    ghrBits: positiveIntegerSchema,
    phtEntries: positiveIntegerSchema,
    counterBits: positiveIntegerSchema,
    initialGhrValue: nonNegativeIntegerSchema,
    initialCounterValue: nonNegativeIntegerSchema
  })
  .strict();

const globalIndexedPredictorBaseSchema = z
  .object({
    ghrBits: positiveIntegerSchema,
    phtEntries: positiveIntegerSchema,
    counterBits: positiveIntegerSchema,
    initialGhrValue: nonNegativeIntegerSchema,
    initialCounterValue: nonNegativeIntegerSchema,
    pcBits: positiveIntegerSchema.max(32),
    ghrBitsUsed: positiveIntegerSchema,
    ignoreLowBits: nonNegativeIntegerSchema.optional()
  })
  .strict();

const gsharePredictorConfigSchema = globalIndexedPredictorBaseSchema.extend({
  type: z.literal("gshare")
});

const gselectPredictorConfigSchema = globalIndexedPredictorBaseSchema.extend({
  type: z.literal("gselect")
});

const localCorrelatedPredictorConfigSchema = z
  .object({
    type: z.literal("local-correlated"),
    localHistoryBits: positiveIntegerSchema,
    localHistoryTableEntries: positiveIntegerSchema,
    localPredictionTableEntries: positiveIntegerSchema,
    counterBits: positiveIntegerSchema,
    initialLocalHistoryValue: nonNegativeIntegerSchema,
    initialCounterValue: nonNegativeIntegerSchema,
    indexPolicy: indexPolicySchema
  })
  .strict();

type PredictorConfigCandidate =
  | z.infer<typeof oneLevelPredictorConfigSchema>
  | z.infer<typeof twoLevelPredictorConfigSchema>
  | z.infer<typeof globalCorrelatedPredictorConfigSchema>
  | z.infer<typeof gsharePredictorConfigSchema>
  | z.infer<typeof gselectPredictorConfigSchema>
  | z.infer<typeof localCorrelatedPredictorConfigSchema>;

export const predictorConfigSchema = z
  .discriminatedUnion("type", [
    oneLevelPredictorConfigSchema,
    twoLevelPredictorConfigSchema,
    globalCorrelatedPredictorConfigSchema,
    gsharePredictorConfigSchema,
    gselectPredictorConfigSchema,
    localCorrelatedPredictorConfigSchema
  ])
  .superRefine(validatePredictorConfigInvariants);

export type SessionYamlPredictorConfig = z.infer<typeof predictorConfigSchema>;

function validatePredictorConfigInvariants(
  config: PredictorConfigCandidate,
  context: z.RefinementCtx
) {
  switch (config.type) {
    case "one-level":
      assertReachableLsbEntries(context, config.indexPolicy);
      assertMatchingEntries(context, config.indexPolicy.entries, config.entries, ["indexPolicy", "entries"], "entries");
      assertFitsBits(context, config.initialCounterValue, config.counterBits, ["initialCounterValue"], "initialCounterValue", "counterBits");
      return;
    case "two-level":
      assertReachableLsbEntries(context, config.indexPolicy);
      assertMatchingEntries(
        context,
        config.indexPolicy.entries,
        config.firstLevelEntries,
        ["indexPolicy", "entries"],
        "firstLevelEntries"
      );
      assertPowerOfTwo(context, config.countersPerEntry, config.historyBits, ["countersPerEntry"], "countersPerEntry", "historyBits");
      assertFitsBits(context, config.initialHistoryValue, config.historyBits, ["initialHistoryValue"], "initialHistoryValue", "historyBits");
      assertFitsBits(context, config.initialCounterValue, config.counterBits, ["initialCounterValue"], "initialCounterValue", "counterBits");
      assertInitialCounterValues(context, config.initialCounterValues, config.firstLevelEntries, config.countersPerEntry, config.counterBits);
      return;
    case "global-correlated":
      assertPowerOfTwo(context, config.phtEntries, config.ghrBits, ["phtEntries"], "phtEntries", "ghrBits");
      assertFitsBits(context, config.initialGhrValue, config.ghrBits, ["initialGhrValue"], "initialGhrValue", "ghrBits");
      assertFitsBits(context, config.initialCounterValue, config.counterBits, ["initialCounterValue"], "initialCounterValue", "counterBits");
      return;
    case "gshare":
      assertGhrBitsUsed(context, config.ghrBitsUsed, config.ghrBits);
      assertMatchingEntries(context, config.pcBits, config.ghrBitsUsed, ["pcBits"], "ghrBitsUsed");
      assertPowerOfTwo(context, config.phtEntries, config.pcBits, ["phtEntries"], "phtEntries", "pcBits");
      assertFitsBits(context, config.initialGhrValue, config.ghrBits, ["initialGhrValue"], "initialGhrValue", "ghrBits");
      assertFitsBits(context, config.initialCounterValue, config.counterBits, ["initialCounterValue"], "initialCounterValue", "counterBits");
      return;
    case "gselect":
      assertGhrBitsUsed(context, config.ghrBitsUsed, config.ghrBits);
      assertExpectedValue(
        context,
        config.phtEntries,
        2 ** (config.pcBits + config.ghrBitsUsed),
        ["phtEntries"],
        "phtEntries must be 2 ** (pcBits + ghrBitsUsed)"
      );
      assertFitsBits(context, config.initialGhrValue, config.ghrBits, ["initialGhrValue"], "initialGhrValue", "ghrBits");
      assertFitsBits(context, config.initialCounterValue, config.counterBits, ["initialCounterValue"], "initialCounterValue", "counterBits");
      return;
    case "local-correlated":
      assertReachableLsbEntries(context, config.indexPolicy);
      assertMatchingEntries(
        context,
        config.indexPolicy.entries,
        config.localHistoryTableEntries,
        ["indexPolicy", "entries"],
        "localHistoryTableEntries"
      );
      assertPowerOfTwo(
        context,
        config.localPredictionTableEntries,
        config.localHistoryBits,
        ["localPredictionTableEntries"],
        "localPredictionTableEntries",
        "localHistoryBits"
      );
      assertFitsBits(
        context,
        config.initialLocalHistoryValue,
        config.localHistoryBits,
        ["initialLocalHistoryValue"],
        "initialLocalHistoryValue",
        "localHistoryBits"
      );
      assertFitsBits(context, config.initialCounterValue, config.counterBits, ["initialCounterValue"], "initialCounterValue", "counterBits");
  }
}

function assertInitialCounterValues(
  context: z.RefinementCtx,
  initialCounterValues: readonly (readonly number[])[] | undefined,
  firstLevelEntries: number,
  countersPerEntry: number,
  counterBits: number
) {
  if (initialCounterValues === undefined) {
    return;
  }
  if (initialCounterValues.length !== firstLevelEntries) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "initialCounterValues rows must match firstLevelEntries",
      path: ["initialCounterValues"]
    });
    return;
  }
  initialCounterValues.forEach((row, rowIndex) => {
    if (row.length !== countersPerEntry) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "initialCounterValues columns must match countersPerEntry",
        path: ["initialCounterValues", rowIndex]
      });
    }
    row.forEach((value, counterIndex) =>
      assertFitsBits(
        context,
        value,
        counterBits,
        ["initialCounterValues", rowIndex, counterIndex],
        "initialCounterValues value",
        "counterBits"
      )
    );
  });
}

function assertReachableLsbEntries(
  context: z.RefinementCtx,
  indexPolicy: z.infer<typeof indexPolicySchema>
) {
  if (indexPolicy.type === "lsb" && indexPolicy.entries > 2 ** indexPolicy.addressBits) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "entries must be reachable by addressBits",
      path: ["indexPolicy", "entries"]
    });
  }
}

function assertMatchingEntries(
  context: z.RefinementCtx,
  actual: number,
  expected: number,
  path: (string | number)[],
  expectedField: string
) {
  assertExpectedValue(
    context,
    actual,
    expected,
    path,
    `${path[path.length - 1] ?? "value"} must match ${expectedField}`
  );
}

function assertPowerOfTwo(
  context: z.RefinementCtx,
  actual: number,
  exponent: number,
  path: (string | number)[],
  actualField: string,
  exponentField: string
) {
  assertExpectedValue(context, actual, 2 ** exponent, path, `${actualField} must be 2 ** ${exponentField}`);
}

function assertFitsBits(
  context: z.RefinementCtx,
  value: number,
  bits: number,
  path: (string | number)[],
  valueField: string,
  bitsField: string
) {
  if (value >= 2 ** bits) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: `${valueField} must fit within ${bitsField}`,
      path
    });
  }
}

function assertGhrBitsUsed(context: z.RefinementCtx, ghrBitsUsed: number, ghrBits: number) {
  if (ghrBitsUsed > ghrBits) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "ghrBitsUsed must be less than or equal to ghrBits",
      path: ["ghrBitsUsed"]
    });
  }
}

function assertExpectedValue(
  context: z.RefinementCtx,
  actual: number,
  expected: number,
  path: (string | number)[],
  message: string
) {
  if (actual !== expected) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message,
      path
    });
  }
}
