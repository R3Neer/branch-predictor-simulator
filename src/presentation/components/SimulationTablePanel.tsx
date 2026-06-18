import { Box, Button, Divider, Menu, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { useMemo, useState, type ReactNode } from "react";
import type { DynamicTableView } from "../../application";
import { BackIcon, DownloadIcon, PlayIcon, ResetIcon, RunAllIcon } from "./ActionIcons";
import { visualTokens } from "../theme/tokens";

export interface SimulationTablePanelProps {
  readonly currentStep: number;
  readonly totalSteps: number;
  readonly tableView: DynamicTableView;
  readonly exportedTable?: string;
  readonly exportedSessionYaml?: string;
  readonly onStep: () => void;
  readonly onStepBack: () => void;
  readonly onRunAll: () => void;
  readonly onReset: () => void;
  readonly onExportCsv: () => void;
  readonly onExportMarkdown: () => void;
  readonly onExportSessionYaml: () => void;
}

export function SimulationTablePanel({
  currentStep,
  totalSteps,
  tableView,
  exportedTable,
  exportedSessionYaml,
  onStep,
  onStepBack,
  onRunAll,
  onReset,
  onExportCsv,
  onExportMarkdown,
  onExportSessionYaml
}: SimulationTablePanelProps) {
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const isExportMenuOpen = Boolean(exportMenuAnchor);
  const columns = useMemo<ColumnDef<DynamicTableView["rows"][number]>[]>(
    () =>
      tableView.columns.map((column) => ({
        id: column.id,
        header: column.label,
        cell: ({ row }) => renderProjectedCell(column.id, row.original.cells[column.id]?.value ?? "")
      })),
    [tableView.columns]
  );
  const rows = useMemo(() => [...tableView.rows], [tableView.rows]);
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <>
      <Paper
        variant="outlined"
        sx={{
          borderRadius: `${visualTokens.radius.shell}px`,
          boxShadow: visualTokens.shadow.table,
          overflow: "hidden"
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          sx={{ p: 1.5, alignItems: "center", flexWrap: "wrap" }}
        >
          <Button
            startIcon={<BackIcon />}
            variant="outlined"
            onClick={onStepBack}
            disabled={currentStep === 0}
          >
            Back
          </Button>
          <Button
            startIcon={<PlayIcon />}
            variant="contained"
            onClick={onStep}
            disabled={currentStep >= totalSteps}
          >
            Step
          </Button>
          <Button
            startIcon={<RunAllIcon />}
            variant="outlined"
            onClick={onRunAll}
            disabled={currentStep >= totalSteps}
          >
            Run all
          </Button>
          <Button
            startIcon={<ResetIcon />}
            variant="outlined"
            color="inherit"
            onClick={onReset}
            disabled={currentStep === 0}
          >
            Reset
          </Button>
          <Button
            startIcon={<DownloadIcon />}
            variant="outlined"
            aria-controls={isExportMenuOpen ? "table-export-menu" : undefined}
            aria-expanded={isExportMenuOpen ? "true" : undefined}
            aria-haspopup="menu"
            onClick={(event) => setExportMenuAnchor(event.currentTarget)}
          >
            Export
          </Button>
          <Menu
            id="table-export-menu"
            anchorEl={exportMenuAnchor}
            open={isExportMenuOpen}
            onClose={() => setExportMenuAnchor(null)}
            MenuListProps={{ "aria-label": "Export options" }}
          >
            <MenuItem
              disabled={currentStep === 0}
              onClick={() => {
                setExportMenuAnchor(null);
                onExportCsv();
              }}
            >
              Table as CSV
            </MenuItem>
            <MenuItem
              disabled={currentStep === 0}
              onClick={() => {
                setExportMenuAnchor(null);
                onExportMarkdown();
              }}
            >
              Table as Markdown
            </MenuItem>
            <MenuItem
              onClick={() => {
                setExportMenuAnchor(null);
                onExportSessionYaml();
              }}
            >
              Session as YAML
            </MenuItem>
          </Menu>
          <Typography sx={{ ml: { sm: "auto" } }} variant="body2">
            Step {currentStep} / {totalSteps}
          </Typography>
        </Stack>
        <Divider />
        <Box sx={{ overflowX: "auto" }}>
          <Box
            component="table"
            aria-label="Simulation table"
            sx={{
              minWidth: 760,
              width: "100%",
              borderCollapse: "collapse",
              "& th, & td": {
                height: 40,
                px: 1.25,
                py: 0.75,
                borderBottom: 1,
                borderColor: "divider",
                textAlign: "left",
                whiteSpace: "nowrap"
              },
              "& th": {
                bgcolor: visualTokens.color.surfaceMuted,
                fontWeight: 650,
                position: "sticky",
                top: 0,
                zIndex: 1
              },
              "& tbody tr:nth-of-type(even)": {
                bgcolor: visualTokens.color.surfaceSoft
              }
            }}
          >
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id}>
                      {header.isPlaceholder
                        ? undefined
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={tableView.columns.length}>No executed steps</td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </Box>
        </Box>
      </Paper>
      {exportedTable ? (
        <TextField
          label="Table export"
          multiline
          minRows={4}
          value={exportedTable}
          InputProps={{
            readOnly: true,
            sx: { fontFamily: '"Roboto Mono", Consolas, monospace', fontSize: "0.8125rem" }
          }}
        />
      ) : undefined}
      {exportedSessionYaml ? (
        <TextField
          label="YAML session"
          multiline
          minRows={6}
          value={exportedSessionYaml}
          InputProps={{
            readOnly: true,
            sx: { fontFamily: '"Roboto Mono", Consolas, monospace', fontSize: "0.8125rem" }
          }}
        />
      ) : undefined}
    </>
  );
}

function renderProjectedCell(columnId: string, value: string): ReactNode {
  if (value.trim() === "") {
    return <Box component="span" aria-label="Hidden or empty cell" sx={{ color: "text.secondary" }} />;
  }

  const normalizedValue = value.trim().toLowerCase();
  const normalizedColumn = columnId.toLowerCase();

  if ((value === "T" || value === "NT") && /(actual|prediction|outcome)/.test(normalizedColumn)) {
    return <SemanticPill tone={value === "T" ? "taken" : "notTaken"}>{value}</SemanticPill>;
  }

  if (normalizedValue === "hit" || normalizedValue === "miss") {
    return <SemanticPill tone={normalizedValue}>{value}</SemanticPill>;
  }

  if (/alias/.test(normalizedColumn) && normalizedValue !== "false" && normalizedValue !== "none") {
    return <SemanticPill tone="aliasing">{value}</SemanticPill>;
  }

  if (/counter/.test(normalizedColumn)) {
    return <SemanticPill tone="counter">{value}</SemanticPill>;
  }

  if (/history|ghr/.test(normalizedColumn)) {
    return <SemanticPill tone="history">{value}</SemanticPill>;
  }

  return value;
}

function SemanticPill({
  children,
  tone
}: {
  readonly children: ReactNode;
  readonly tone: "taken" | "notTaken" | "hit" | "miss" | "counter" | "history" | "aliasing";
}) {
  const colorMap = {
    taken: { background: visualTokens.color.successSoft, color: visualTokens.color.success },
    notTaken: { background: visualTokens.color.surfaceMuted, color: visualTokens.color.text },
    hit: { background: visualTokens.color.successSoft, color: visualTokens.color.hit },
    miss: { background: visualTokens.color.dangerSoft, color: visualTokens.color.miss },
    counter: { background: visualTokens.color.warningSoft, color: visualTokens.color.counter },
    history: { background: "#ececff", color: visualTokens.color.history },
    aliasing: { background: visualTokens.color.warningSoft, color: visualTokens.color.aliasing }
  }[tone];

  return (
    <Box
      component="span"
      sx={{
        bgcolor: colorMap.background,
        borderRadius: 999,
        color: colorMap.color,
        display: "inline-flex",
        fontSize: "0.75rem",
        fontWeight: 700,
        lineHeight: 1,
        px: 0.75,
        py: 0.45
      }}
    >
      {children}
    </Box>
  );
}
