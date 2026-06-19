import { describe, expect, it } from "vitest";
import {
  createManualSequenceDraftRow,
  formatManualSequenceDraft,
  parseManualSequenceDraft
} from "./manualSequenceDraft";

describe("manualSequenceDraft", () => {
  it("parses manual rows and loop lines into editable draft data", () => {
    const draft = parseManualSequenceDraft("B1 T index=0 address=0x10 # warmup\nB2 NT i=1\nloop 0..1 x2");

    expect(draft.rows).toMatchObject([
      { branchId: "B1", outcome: "T", manualIndex: "0", address: "0x10", comment: "warmup" },
      { branchId: "B2", outcome: "NT", manualIndex: "1", address: "", comment: "" }
    ]);
    expect(draft.loopLines).toEqual(["loop 0..1 x2"]);
  });

  it("formats editable draft data back to the canonical manual text", () => {
    const row = createManualSequenceDraftRow(1);
    const formatted = formatManualSequenceDraft({
      rows: [
        {
          ...row,
          branchId: "B1",
          outcome: "nt",
          manualIndex: "2",
          address: "0x20",
          comment: "edited"
        }
      ],
      loopLines: ["loop 0..0 x3"]
    });

    expect(formatted).toBe("B1 NT index=2 address=0x20 # edited\nloop 0..0 x3");
  });
});
