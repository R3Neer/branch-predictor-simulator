import type { DynamicTableView } from "../../application/projectors/TableProjector";

export class CsvTableExporter {
  export(table: DynamicTableView): string {
    const header = table.columns.map((column) => csvEscape(column.label)).join(",");
    const rows = table.rows.map((row) =>
      table.columns.map((column) => csvEscape(row.cells[column.id]?.value ?? "")).join(",")
    );

    return [header, ...rows].join("\n");
  }
}

export class MarkdownTableExporter {
  export(table: DynamicTableView): string {
    const header = `| ${table.columns.map((column) => column.label).join(" | ")} |`;
    const separator = `| ${table.columns.map(() => "---").join(" | ")} |`;
    const rows = table.rows.map(
      (row) => `| ${table.columns.map((column) => markdownEscape(row.cells[column.id]?.value ?? "")).join(" | ")} |`
    );

    return [header, separator, ...rows].join("\n");
  }
}

function csvEscape(value: string): string {
  if (!/[",\n]/.test(value)) {
    return value;
  }

  return `"${value.replace(/"/g, '""')}"`;
}

function markdownEscape(value: string): string {
  return value.replace(/\|/g, "\\|");
}
