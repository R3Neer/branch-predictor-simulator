export type SemanticTokenType =
  | "address"
  | "branchId"
  | "comment"
  | "immediate"
  | "keyword"
  | "label"
  | "mnemonic"
  | "option"
  | "range"
  | "register"
  | "repetition";

export interface SemanticToken {
  readonly from: number;
  readonly to: number;
  readonly type: SemanticTokenType;
}

const riscvMnemonics = new Set([
  "add",
  "addi",
  "beq",
  "beqz",
  "bge",
  "bgt",
  "ble",
  "blt",
  "bne",
  "bnez",
  "jal",
  "sub"
]);

const registerAliases = new Set([
  "zero",
  "ra",
  "sp",
  "gp",
  "tp",
  "t0",
  "t1",
  "t2",
  "s0",
  "fp",
  "s1",
  "a0",
  "a1",
  "a2",
  "a3",
  "a4",
  "a5",
  "a6",
  "a7",
  "s2",
  "s3",
  "s4",
  "s5",
  "s6",
  "s7",
  "s8",
  "s9",
  "s10",
  "s11",
  "t3",
  "t4",
  "t5",
  "t6"
]);

export function tokenizeRiscV(source: string): readonly SemanticToken[] {
  return tokenizeLines(source, (line, offset) => {
    const tokens: SemanticToken[] = [];
    const { code, commentStart } = splitComment(line);

    pushMatches(tokens, code, offset, /^\s*([A-Za-z_.$][\w.$]*:)/g, "label", 1);
    pushMatches(tokens, code, offset, /\b0x[0-9a-fA-F]+\b/g, "address");
    pushMatches(tokens, code, offset, /\b([A-Za-z.][\w.]*)\b/g, "mnemonic", 1, (value) =>
      riscvMnemonics.has(value.toLowerCase())
    );
    pushMatches(tokens, code, offset, /\b(x(?:[0-9]|[12][0-9]|3[01])|[a-z][a-z0-9]*)\b/g, "register", 1, (value) =>
      /^x(?:[0-9]|[12][0-9]|3[01])$/.test(value) || registerAliases.has(value)
    );
    pushMatches(tokens, code, offset, /(?<![\w.])-?\b\d+\b/g, "immediate");

    if (commentStart >= 0) {
      tokens.push({ from: offset + commentStart, to: offset + line.length, type: "comment" });
    }

    return tokens;
  });
}

export function tokenizeManualSequence(source: string): readonly SemanticToken[] {
  return tokenizeLines(source, (line, offset) => {
    const tokens: SemanticToken[] = [];
    const { code, commentStart } = splitComment(line);

    pushMatches(tokens, code, offset, /\bB\d+\b/g, "branchId");
    pushMatches(tokens, code, offset, /\b(?:T|NT)\b/g, "keyword");
    pushMatches(tokens, code, offset, /\b(?:index|manualIndex|i|address|addr)=/g, "option");
    pushMatches(tokens, code, offset, /\b(?:loop|repeat)\b/g, "keyword");
    pushMatches(tokens, code, offset, /\b\d+\.\.\d+\b/g, "range");
    pushMatches(tokens, code, offset, /\bx\d+\b/g, "repetition");

    if (commentStart >= 0) {
      tokens.push({ from: offset + commentStart, to: offset + line.length, type: "comment" });
    }

    return tokens;
  });
}

function tokenizeLines(
  source: string,
  tokenizeLine: (line: string, offset: number) => readonly SemanticToken[]
): readonly SemanticToken[] {
  const tokens: SemanticToken[] = [];
  let offset = 0;

  for (const line of source.split("\n")) {
    tokens.push(...tokenizeLine(line, offset));
    offset += line.length + 1;
  }

  return tokens.sort((left, right) => left.from - right.from || left.to - right.to);
}

function splitComment(line: string) {
  const commentStart = line.indexOf("#");
  return {
    code: commentStart >= 0 ? line.slice(0, commentStart) : line,
    commentStart
  };
}

function pushMatches(
  tokens: SemanticToken[],
  source: string,
  lineOffset: number,
  pattern: RegExp,
  type: SemanticTokenType,
  captureGroup = 0,
  filter: (value: string) => boolean = () => true
) {
  for (const match of source.matchAll(pattern)) {
    const value = match[captureGroup];
    if (!value || !filter(value)) {
      continue;
    }

    const matchIndex = match.index ?? 0;
    const captureOffset = captureGroup === 0 ? 0 : match[0].indexOf(value);
    const from = lineOffset + matchIndex + captureOffset;
    tokens.push({ from, to: from + value.length, type });
  }
}
