import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Button,
  Stack,
  TextField,
  Typography
} from "@mui/material";

export interface ImportSessionPanelProps {
  readonly sessionYamlInput: string;
  readonly sessionImportError?: string;
  readonly onSessionYamlInputChange: (value: string) => void;
  readonly onImport: () => void;
}

export function ImportSessionPanel({
  sessionYamlInput,
  sessionImportError,
  onSessionYamlInputChange,
  onImport
}: ImportSessionPanelProps) {
  return (
    <Accordion disableGutters elevation={0} sx={{ bgcolor: "transparent", border: 0 }}>
      <AccordionSummary aria-controls="session-import-panel" id="session-import-header">
        <Typography component="h2" variant="h2">
          Import YAML
        </Typography>
      </AccordionSummary>
      <AccordionDetails id="session-import-panel" sx={{ px: 0 }}>
        <Stack spacing={1.5}>
          <TextField
            label="Session YAML input"
            multiline
            minRows={5}
            value={sessionYamlInput}
            onChange={(event) => onSessionYamlInputChange(event.target.value)}
            InputProps={{
              sx: { fontFamily: '"Roboto Mono", Consolas, monospace', fontSize: "0.8125rem" }
            }}
          />
          {sessionImportError ? <Alert severity="warning">{sessionImportError}</Alert> : undefined}
          <Button variant="outlined" onClick={onImport} disabled={sessionYamlInput.trim() === ""}>
            Import
          </Button>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
