import { Accordion, AccordionDetails, AccordionSummary, Box, Stack, Typography } from "@mui/material";
import { ConfigurationPanel, type ConfigurationPanelProps } from "./ConfigurationPanel";
import { ImportSessionPanel, type ImportSessionPanelProps } from "./ImportSessionPanel";

export interface SetupPanelProps extends ConfigurationPanelProps, ImportSessionPanelProps {
  readonly compact?: boolean;
}

export function SetupPanel({
  compact = false,
  sessionYamlInput,
  sessionImportError,
  onSessionYamlInputChange,
  onImport,
  ...configurationProps
}: SetupPanelProps) {
  const content = (
    <Stack spacing={1.5}>
      <ConfigurationPanel {...configurationProps} />
      <ImportSessionPanel
        sessionYamlInput={sessionYamlInput}
        sessionImportError={sessionImportError}
        onSessionYamlInputChange={onSessionYamlInputChange}
        onImport={onImport}
      />
    </Stack>
  );

  if (!compact) {
    return content;
  }

  return (
    <Accordion
      disableGutters
      elevation={0}
      sx={{
        bgcolor: "background.paper",
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        "&::before": { display: "none" }
      }}
    >
      <AccordionSummary
        aria-controls="setup-and-answers-panel"
        expandIcon={<Box component="span" aria-hidden="true">v</Box>}
        id="setup-and-answers-header"
        sx={{
          minHeight: 42,
          px: 1.25,
          "& .MuiAccordionSummary-content": {
            my: 0.75
          }
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography component="h2" variant="h2">
            Setup and answers
          </Typography>
          <Typography noWrap variant="body2">
            {configurationProps.activeTitle} / {configurationProps.activeVariantTitle}
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails id="setup-and-answers-panel" sx={{ px: 1.25, pt: 0 }}>
        {content}
      </AccordionDetails>
    </Accordion>
  );
}
