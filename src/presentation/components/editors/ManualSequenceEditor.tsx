import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Divider,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import { CodeEditor } from "./CodeEditor";
import {
  createManualSequenceDraftRow,
  duplicateManualSequenceDraftRow,
  formatManualSequenceDraft,
  parseManualSequenceDraft,
  type ManualSequenceDraft,
  type ManualSequenceDraftRow
} from "./manualSequenceDraft";
import { manualSequenceSemanticHighlighting } from "./semanticHighlighting";
import { visualTokens } from "../../theme/tokens";

export interface ManualSequenceEditorProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
}

export function ManualSequenceEditor({ value, onChange }: ManualSequenceEditorProps) {
  const extensions = useMemo(() => [manualSequenceSemanticHighlighting()], []);
  const lastEmittedSource = useRef(value);
  const [draft, setDraft] = useState<ManualSequenceDraft>(() => parseManualSequenceDraft(value));

  useEffect(() => {
    if (value !== lastEmittedSource.current) {
      setDraft(parseManualSequenceDraft(value));
      lastEmittedSource.current = value;
    }
  }, [value]);

  const commitDraft = (nextDraft: ManualSequenceDraft) => {
    setDraft(nextDraft);
    const nextSource = formatManualSequenceDraft(nextDraft);
    lastEmittedSource.current = nextSource;
    onChange(nextSource);
  };
  const updateRow = (rowId: string, field: keyof ManualSequenceDraftRow, fieldValue: string) => {
    commitDraft({
      ...draft,
      rows: draft.rows.map((row) => (row.id === rowId ? { ...row, [field]: fieldValue } : row))
    });
  };
  const addRow = () => {
    commitDraft({
      ...draft,
      rows: [...draft.rows, createManualSequenceDraftRow(draft.rows.length + 1)]
    });
  };
  const duplicateRow = (rowId: string) => {
    const rowIndex = draft.rows.findIndex((row) => row.id === rowId);
    if (rowIndex === -1) {
      return;
    }
    const nextRows = [...draft.rows];
    nextRows.splice(rowIndex + 1, 0, duplicateManualSequenceDraftRow(draft.rows[rowIndex]));
    commitDraft({ ...draft, rows: nextRows });
  };
  const deleteRow = (rowId: string) => {
    commitDraft({ ...draft, rows: draft.rows.filter((row) => row.id !== rowId) });
  };
  const updateLoopLines = (loopText: string) => {
    commitDraft({
      ...draft,
      loopLines: loopText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
    });
  };
  const updateRawSource = (source: string) => {
    lastEmittedSource.current = source;
    setDraft(parseManualSequenceDraft(source));
    onChange(source);
  };

  return (
    <Stack spacing={1.25}>
      <Box sx={{ overflowX: "auto" }}>
        <Box
          component="table"
          aria-label="Manual sequence rows"
          sx={{
            borderCollapse: "collapse",
            minWidth: 760,
            width: "100%",
            "& th, & td": {
              borderBottom: 1,
              borderColor: "divider",
              px: 0.75,
              py: 0.75,
              textAlign: "left",
              verticalAlign: "top"
            },
            "& th": {
              bgcolor: visualTokens.color.surfaceMuted,
              color: visualTokens.color.text,
              fontSize: "0.8125rem",
              fontWeight: 650
            },
            "& tbody tr:nth-of-type(even)": {
              bgcolor: visualTokens.color.surfaceSoft
            }
          }}
        >
          <thead>
            <tr>
              <th>Step</th>
              <th>Branch</th>
              <th>Outcome</th>
              <th>Index</th>
              <th>Address</th>
              <th>Comment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {draft.rows.length === 0 ? (
              <tr>
                <td colSpan={7}>No manual rows</td>
              </tr>
            ) : (
              draft.rows.map((row, index) => (
                <tr key={row.id}>
                  <td>{index + 1}</td>
                  <td>
                    <TextField
                      size="small"
                      value={row.branchId}
                      inputProps={{ "aria-label": `Branch ${index + 1}` }}
                      onChange={(event) => updateRow(row.id, "branchId", event.target.value)}
                    />
                  </td>
                  <td>
                    <TextField
                      select
                      size="small"
                      value={row.outcome}
                      SelectProps={{ native: true }}
                      inputProps={{ "aria-label": `Outcome ${index + 1}` }}
                      onChange={(event) => updateRow(row.id, "outcome", event.target.value)}
                      sx={{ minWidth: 86 }}
                    >
                      <option value="T">T</option>
                      <option value="NT">NT</option>
                    </TextField>
                  </td>
                  <td>
                    <TextField
                      size="small"
                      value={row.manualIndex}
                      inputProps={{ "aria-label": `Index ${index + 1}`, inputMode: "numeric" }}
                      sx={{ width: 92 }}
                      onChange={(event) => updateRow(row.id, "manualIndex", event.target.value)}
                    />
                  </td>
                  <td>
                    <TextField
                      size="small"
                      value={row.address}
                      inputProps={{ "aria-label": `Address ${index + 1}` }}
                      sx={{ width: 116 }}
                      onChange={(event) => updateRow(row.id, "address", event.target.value)}
                    />
                  </td>
                  <td>
                    <TextField
                      size="small"
                      value={row.comment}
                      inputProps={{ "aria-label": `Comment ${index + 1}` }}
                      sx={{ minWidth: 160 }}
                      onChange={(event) => updateRow(row.id, "comment", event.target.value)}
                    />
                  </td>
                  <td>
                    <Stack direction="row" spacing={0.75}>
                      <Button size="small" variant="outlined" onClick={() => duplicateRow(row.id)}>
                        Duplicate
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => deleteRow(row.id)}
                      >
                        Delete
                      </Button>
                    </Stack>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Box>
      </Box>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" } }}>
        <Button variant="outlined" onClick={addRow}>
          Add row
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Typography variant="body2">{draft.rows.length} rows</Typography>
      </Stack>
      <Divider />
      <TextField
        label="Loop ranges"
        multiline
        minRows={2}
        value={draft.loopLines.join("\n")}
        inputProps={{ "aria-label": "Loop ranges" }}
        onChange={(event) => updateLoopLines(event.target.value)}
      />
      <Accordion disableGutters elevation={0} variant="outlined">
        <AccordionSummary
          expandIcon={<Box component="span" aria-hidden="true">v</Box>}
          sx={{ minHeight: 36, "& .MuiAccordionSummary-content": { my: 0.5 } }}
        >
          <Typography variant="h3">Raw sequence</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 1 }}>
          <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1, overflow: "hidden" }}>
            <CodeEditor
              ariaLabel="Manual sequence text"
              value={value}
              extensions={extensions}
              onChange={updateRawSource}
            />
          </Box>
        </AccordionDetails>
      </Accordion>
    </Stack>
  );
}
