import type { TableAnswer } from "./AnswerChecker";

export class TableAnswerParser {
  parse(source: string): readonly TableAnswer[] {
    return source
      .split(/\r?\n/)
      .map((line, index) => this.parseLine(line, index + 1))
      .filter((answer): answer is TableAnswer => answer !== undefined);
  }

  private parseLine(line: string, lineNumber: number): TableAnswer | undefined {
    const [bodyPart] = line.split("#", 1);
    const body = bodyPart.trim();
    if (body.length === 0) {
      return undefined;
    }

    const [stepToken, ...optionTokens] = body.split(/\s+/);
    const step = Number(stepToken);
    if (!Number.isInteger(step) || step <= 0) {
      throw new Error(`line ${lineNumber}: step must be a positive integer`);
    }

    let prediction: string | undefined;
    let hit: string | undefined;
    let counterAfter: string | undefined;
    for (const token of optionTokens) {
      const [rawKey, value] = token.split("=", 2);
      if (!rawKey || value === undefined) {
        throw new Error(`line ${lineNumber}: invalid answer token ${token}`);
      }

      const key = rawKey.toLowerCase();
      if (key === "prediction" || key === "pred") {
        prediction = value;
      } else if (key === "hit") {
        hit = value;
      } else if (key === "counterafter" || key === "counter") {
        counterAfter = value;
      } else {
        throw new Error(`line ${lineNumber}: unknown answer field ${rawKey}`);
      }
    }

    return { step, prediction, hit, counterAfter };
  }
}
