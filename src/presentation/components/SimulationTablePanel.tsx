import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Menu,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
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
  const [activeExport, setActiveExport] = useState<"csv" | "markdown" | "yaml" | undefined>();
  const [copyStatus, setCopyStatus] = useState<string | undefined>();
  const isExportMenuOpen = Boolean(exportMenuAnchor);
  const exportedContent = activeExport === "yaml" ? exportedSessionYaml : exportedTable;
  const exportedLabel = activeExport === "yaml" ? "YAML session" : "Table export";
  const exportedTitle =
    activeExport === "yaml" ? "Session YAML" : activeExport === "csv" ? "Table CSV" : "Table Markdown";
  const exportFileName =
    activeExport === "yaml"
      ? "branch-predictor-session.yaml"
      : activeExport === "csv"
        ? "branch-predictor-table.csv"
        : "branch-predictor-table.md";
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
  const copyExport = () => {
    if (!exportedContent) {
      return;
    }

    void navigator.clipboard
      ?.writeText(exportedContent)
      .then(() => setCopyStatus("Copied"))
      .catch(() => setCopyStatus("Copy failed"));
  };
  const downloadExport = () => {
    if (!exportedContent) {
      return;
    }

    const blob = new Blob([exportedContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = exportFileName;
    anchor.click();
    URL.revokeObjectURL(url);
  };

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
          direction={{ xs: "column", sm: "row" }}
          spacing={0.75}
          sx={{ alignItems: { xs: "stretch", sm: "center" }, px: 1.5, pt: 1.25 }}
        >
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography component="h2" variant="h2">
              Execution trace
            </Typography>
          </Box>
          <Box
            component="span"
            sx={{
              alignSelf: { xs: "flex-start", sm: "center" },
              bgcolor: visualTokens.color.accentSoft,
              borderRadius: 999,
              color: visualTokens.color.accent,
              fontSize: "0.75rem",
              fontWeight: 700,
              px: 1,
              py: 0.5
            }}
          >
            Step {currentStep} / {totalSteps}
          </Box>
        </Stack>
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          sx={{
            alignItems: "center",
            display: { xs: "grid", sm: "flex" },
            flexWrap: "wrap",
            gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "none" },
            p: 1.5,
            pt: 1,
            "& .MuiButton-root": {
              width: { xs: "100%", sm: "auto" }
            }
          }}
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
                setCopyStatus(undefined);
                setActiveExport("csv");
                onExportCsv();
              }}
            >
              Table as CSV
            </MenuItem>
            <MenuItem
              disabled={currentStep === 0}
              onClick={() => {
                setExportMenuAnchor(null);
                setCopyStatus(undefined);
                setActiveExport("markdown");
                onExportMarkdown();
              }}
            >
              Table as Markdown
            </MenuItem>
            <MenuItem
              onClick={() => {
                setExportMenuAnchor(null);
                setCopyStatus(undefined);
                setActiveExport("yaml");
                onExportSessionYaml();
              }}
            >
              Session as YAML
            </MenuItem>
          </Menu>
        </Stack>
        <Divider />
        <Box sx={{ position: "relative" }}>
          <Box
            aria-hidden="true"
            sx={{
              background: `linear-gradient(90deg, rgba(255,255,255,0), ${visualTokens.color.surface})`,
              bottom: 0,
              pointerEvents: "none",
              position: "absolute",
              right: 0,
              top: 0,
              width: 44,
              zIndex: 3,
              "&::after": {
                color: visualTokens.color.textMuted,
                content: '">"',
                fontSize: "1.25rem",
                fontWeight: 700,
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)"
              }
            }}
          />
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
                "& th:nth-of-type(1), & td:nth-of-type(1)": {
                  left: 0,
                  minWidth: 78,
                  position: "sticky",
                  zIndex: 2
                },
                "& th:nth-of-type(2), & td:nth-of-type(2)": {
                  left: 78,
                  minWidth: 72,
                  position: "sticky",
                  zIndex: 2
                },
                "& td:nth-of-type(1), & td:nth-of-type(2)": {
                  bgcolor: "inherit"
                },
                "& th": {
                  bgcolor: visualTokens.color.surfaceMuted,
                  fontWeight: 650,
                  position: "sticky",
                  top: 0,
                  zIndex: 4
                },
                "& th:nth-of-type(1), & th:nth-of-type(2)": {
                  zIndex: 5
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
        </Box>
      </Paper>
      <Dialog
        fullWidth
        maxWidth="md"
        open={activeExport !== undefined && exportedContent !== undefined}
        PaperProps={{
          sx: {
            maxHeight: "calc(100vh - 48px)"
          }
        }}
        transitionDuration={0}
        onClose={() => setActiveExport(undefined)}
      >
        <DialogTitle>{exportedTitle}</DialogTitle>
        <DialogContent sx={{ overflow: "hidden", pb: 1 }}>
          <Typography sx={{ color: "text.secondary", fontWeight: 650, mb: 0.75 }} variant="body2">
            {exportedLabel}
          </Typography>
          <TextField
            multiline
            fullWidth
            minRows={activeExport === "yaml" ? 12 : 8}
            value={exportedContent ?? ""}
            inputProps={{ "aria-label": exportedLabel }}
            InputProps={{
              readOnly: true,
              sx: {
                bgcolor: visualTokens.color.surfaceSoft,
                fontFamily: '"Roboto Mono", Consolas, monospace',
                fontSize: "0.8125rem",
                "& textarea": {
                  maxHeight: "min(52vh, 520px)",
                  overflow: "auto !important"
                }
              }
            }}
          />
          {copyStatus ? (
            <Typography sx={{ mt: 1 }} variant="body2">
              {copyStatus}
            </Typography>
          ) : undefined}
        </DialogContent>
        <DialogActions>
          <Button onClick={copyExport}>Copy</Button>
          <Button variant="contained" onClick={downloadExport}>
            Download
          </Button>
          <Button onClick={() => setActiveExport(undefined)}>Close</Button>
        </DialogActions>
      </Dialog>
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
        px: 0.85,
        py: 0.5
      }}
    >
      {children}
    </Box>
  );
}
