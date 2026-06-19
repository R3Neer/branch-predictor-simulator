export interface ManualSequenceDraft {
  readonly rows: readonly ManualSequenceDraftRow[];
  readonly loopLines: readonly string[];
}

export interface ManualSequenceDraftRow {
  readonly id: string;
  readonly branchId: string;
  readonly outcome: string;
  readonly manualIndex: string;
  readonly address: string;
  readonly comment: string;
}

export function createManualSequenceDraftRow(order: number): ManualSequenceDraftRow {
  return {
    id: createDraftRowId(),
    branchId: `B${order}`,
    outcome: "T",
    manualIndex: "0",
    address: "",
    comment: ""
  };
}

export function duplicateManualSequenceDraftRow(row: ManualSequenceDraftRow): ManualSequenceDraftRow {
  return { ...row, id: createDraftRowId() };
}

export function parseManualSequenceDraft(source: string): ManualSequenceDraft {
  const rows: ManualSequenceDraftRow[] = [];
  const loopLines: string[] = [];

  source.split(/\r?\n/).forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) {
      return;
    }

    const [bodyPart, commentPart] = splitComment(line);
    const body = bodyPart.trim();
    if (!body) {
      return;
    }

    const tokens = body.split(/\s+/);
    const command = tokens[0]?.toLowerCase();
    if (command === "loop" || command === "repeat") {
      loopLines.push(body);
      return;
    }

    const [branchId = "", outcome = "", ...optionTokens] = tokens;
    const options = parseDraftOptions(optionTokens);
    rows.push({
      id: createDraftRowId(),
      branchId,
      outcome: outcome.toUpperCase(),
      manualIndex: options.manualIndex,
      address: options.address,
      comment: commentPart.trim()
    });
  });

  return { rows, loopLines };
}

export function formatManualSequenceDraft(draft: ManualSequenceDraft): string {
  const rowLines = draft.rows.map((row) => {
    const parts = [row.branchId.trim(), row.outcome.trim().toUpperCase()].filter(Boolean);
    const manualIndex = row.manualIndex.trim();
    const address = row.address.trim();
    if (manualIndex) {
      parts.push(`index=${manualIndex}`);
    }
    if (address) {
      parts.push(`address=${address}`);
    }

    const body = parts.join(" ");
    const comment = row.comment.trim();
    return comment ? `${body} # ${comment}` : body;
  });

  return [...rowLines, ...draft.loopLines].filter(Boolean).join("\n");
}

function parseDraftOptions(optionTokens: readonly string[]) {
  const options = { manualIndex: "", address: "" };
  optionTokens.forEach((token) => {
    const [rawKey, rawValue] = token.split("=", 2);
    if (rawValue === undefined) {
      return;
    }

    const key = rawKey.toLowerCase();
    if (key === "index" || key === "manualindex" || key === "i") {
      options.manualIndex = rawValue;
    }
    if (key === "address" || key === "addr") {
      options.address = rawValue;
    }
  });

  return options;
}

function splitComment(line: string): readonly [string, string] {
  const commentIndex = line.indexOf("#");
  if (commentIndex === -1) {
    return [line, ""];
  }

  return [line.slice(0, commentIndex), line.slice(commentIndex + 1)];
}

function createDraftRowId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}
