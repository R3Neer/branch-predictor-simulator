import { describe, expect, it } from "vitest";
import type { DynamicTableView } from "../../application/projectors/TableProjector";
import { CsvTableExporter, MarkdownTableExporter } from "./TableExporters";

const table: DynamicTableView = {
  hiddenUntilRequested: false,
  columns: [
    { id: "branch", label: "Branch" },
    { id: "prediction", label: "Prediction" }
  ],
  rows: [
    {
      id: "1",
      cells: {
        branch: { value: "B1", hidden: false },
        prediction: { value: "NT", hidden: false }
      }
    }
  ]
};

describe("table exporters", () => {
  it("exports CSV from table projection", () => {
    expect(new CsvTableExporter().export(table)).toBe("Branch,Prediction\nB1,NT");
  });

  it("exports Markdown from table projection", () => {
    expect(new MarkdownTableExporter().export(table)).toBe(
      "| Branch | Prediction |\n| --- | --- |\n| B1 | NT |"
    );
  });
});
