export type NormalizedStatAnswerKind = "number" | "ratio";

export interface NormalizedStatAnswer {
  readonly kind: NormalizedStatAnswerKind;
  readonly value: number;
  readonly rawUnit?: string;
}

export class StatAnswerParser {
  parse(raw: string, expectedUnit?: string): NormalizedStatAnswer {
    const trimmed = raw.trim().toLowerCase();
    if (trimmed.length === 0) {
      throw new Error("stat answer cannot be empty");
    }

    const withoutUnit = expectedUnit
      ? trimmed.replace(new RegExp(`\\s*${escapeRegExp(expectedUnit.toLowerCase())}$`), "")
      : trimmed;
    const unit = withoutUnit === trimmed ? undefined : expectedUnit;

    if (withoutUnit.endsWith("%")) {
      return {
        kind: "ratio",
        value: parseFiniteNumber(withoutUnit.slice(0, -1)) / 100,
        rawUnit: "%"
      };
    }

    const fractionMatch = withoutUnit.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/);
    if (fractionMatch) {
      const numerator = parseFiniteNumber(fractionMatch[1]);
      const denominator = parseFiniteNumber(fractionMatch[2]);
      if (denominator === 0) {
        throw new RangeError("fraction denominator cannot be zero");
      }
      return { kind: "ratio", value: numerator / denominator, rawUnit: unit };
    }

    return { kind: "number", value: parseFiniteNumber(withoutUnit), rawUnit: unit };
  }
}

function parseFiniteNumber(raw: string): number {
  const value = Number(raw.trim().replace(",", "."));
  if (!Number.isFinite(value)) {
    throw new Error(`invalid numeric answer: ${raw}`);
  }

  return value;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
