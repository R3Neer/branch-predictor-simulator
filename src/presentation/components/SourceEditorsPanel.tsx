import { Box, Chip, Paper, Stack, Tab, Tabs, Typography } from "@mui/material";
import { useState } from "react";
import type { SourceSyncState } from "../../application";
import { CSourceEditor } from "./editors/CSourceEditor";
import { ManualSequenceEditor } from "./editors/ManualSequenceEditor";
import { RiscVSourceEditor } from "./editors/RiscVSourceEditor";
import { visualTokens } from "../theme/tokens";

export interface SourceEditorsPanelProps {
  readonly cSource: string;
  readonly riscVSource: string;
  readonly sourceSyncState: SourceSyncState;
  readonly manualSequenceSource: string;
  readonly onCSourceChange: (value: string) => void;
  readonly onRiscVSourceChange: (value: string) => void;
  readonly onManualSequenceChange: (value: string) => void;
}

type ActiveSource = "c" | "riscv" | "manual";

export function SourceEditorsPanel({
  cSource,
  riscVSource,
  sourceSyncState,
  manualSequenceSource,
  onCSourceChange,
  onRiscVSourceChange,
  onManualSequenceChange
}: SourceEditorsPanelProps) {
  const [activeSource, setActiveSource] = useState<ActiveSource>("c");
  const activeEditor = {
    c: {
      label: "Didactic C",
      value: cSource,
      readOnly: sourceSyncState === "desynced",
      onChange: onCSourceChange,
      helperText:
        sourceSyncState === "desynced"
          ? "RISC-V was edited directly. Reset or load a template to synchronize C again."
          : "Editing C regenerates RISC-V and the manual branch sequence."
    },
    riscv: {
      label: "RISC-V",
      value: riscVSource,
      readOnly: false,
      onChange: onRiscVSourceChange,
      helperText: "Editing RISC-V updates the branch sequence and marks C as desynchronized."
    },
    manual: {
      label: "Manual sequence",
      value: manualSequenceSource,
      readOnly: false,
      onChange: onManualSequenceChange,
      helperText: "Manual sequence validation remains canonical in the domain parser."
    }
  }[activeSource];
  const editor = {
    c: (
      <CSourceEditor
        value={cSource}
        readOnly={sourceSyncState === "desynced"}
        onChange={onCSourceChange}
      />
    ),
    riscv: <RiscVSourceEditor value={riscVSource} onChange={onRiscVSourceChange} />,
    manual: <ManualSequenceEditor value={manualSequenceSource} onChange={onManualSequenceChange} />
  }[activeSource];

  return (
    <Paper variant="outlined" sx={{ overflow: "hidden" }}>
      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: "center",
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: visualTokens.color.surfaceSoft,
          flexWrap: "wrap",
          px: 1.5,
          py: 1
        }}
      >
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography component="h2" variant="h2">
            Source
          </Typography>
        </Box>
        <Chip
          size="small"
          label={sourceSyncState === "synced" ? "C synchronized" : "C desynchronized"}
          color={sourceSyncState === "synced" ? "success" : "warning"}
          variant="outlined"
        />
      </Stack>
      <Tabs
        value={activeSource}
        aria-label="Source editor"
        variant="scrollable"
        allowScrollButtonsMobile
        onChange={(_event, value: ActiveSource) => setActiveSource(value)}
        sx={{ px: 1, borderBottom: 1, borderColor: "divider" }}
      >
        <Tab value="c" label="Didactic C" />
        <Tab value="riscv" label="RISC-V" />
        <Tab value="manual" label="Manual sequence" />
      </Tabs>
      <Box sx={{ p: 1.5 }}>
        <Stack spacing={0.75}>
          <Typography component="h3" variant="h3">
            {activeEditor.label}
          </Typography>
          <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1, overflow: "hidden" }}>{editor}</Box>
          <Typography variant="body2">{activeEditor.helperText}</Typography>
        </Stack>
      </Box>
    </Paper>
  );
}
