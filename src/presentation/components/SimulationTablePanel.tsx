import { Box, Button, Divider, Paper, Stack, TextField, Typography } from "@mui/material";
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import type { DynamicTableView } from "../../application";
import { BackIcon, DownloadIcon, PlayIcon, ResetIcon, RunAllIcon } from "./ActionIcons";

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
  const columns = useMemo<ColumnDef<DynamicTableView["rows"][number]>[]>(
    () =>
      tableView.columns.map((column) => ({
        id: column.id,
        header: column.label,
        cell: ({ row }) => row.original.cells[column.id]?.value ?? ""
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
      <Paper variant="outlined" sx={{ overflow: "hidden" }}>
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
            onClick={onExportCsv}
            disabled={currentStep === 0}
          >
            CSV
          </Button>
          <Button
            startIcon={<DownloadIcon />}
            variant="outlined"
            onClick={onExportMarkdown}
            disabled={currentStep === 0}
          >
            Markdown
          </Button>
          <Button startIcon={<DownloadIcon />} variant="outlined" onClick={onExportSessionYaml}>
            YAML
          </Button>
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
              width: "100%",
              borderCollapse: "collapse",
              "& th, & td": {
                p: 1.25,
                borderBottom: 1,
                borderColor: "divider",
                textAlign: "left",
                whiteSpace: "nowrap"
              },
              "& th": { bgcolor: "#eef3f3", fontWeight: 500 }
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
