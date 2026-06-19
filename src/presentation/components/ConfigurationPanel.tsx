import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import type { ReactNode } from "react";
import type { CorrectionReport, StatisticKey, StatisticsSet } from "../../application";
import { CheckIcon } from "./ActionIcons";
import { visualTokens } from "../theme/tokens";

interface TemplateOption {
  readonly id: string;
  readonly title: string;
  readonly variants: readonly VariantOption[];
}

interface VariantOption {
  readonly id: string;
  readonly title: string;
}

interface StatisticField {
  readonly key: StatisticKey;
  readonly answerLabel: string;
  readonly resultLabel: string;
  readonly format: (statistics: StatisticsSet) => string;
}

const statisticFields: readonly StatisticField[] = [
  {
    key: "hits",
    answerLabel: "Hits answer",
    resultLabel: "Hits",
    format: (statistics) => String(statistics.hits)
  },
  {
    key: "misses",
    answerLabel: "Misses answer",
    resultLabel: "Misses",
    format: (statistics) => String(statistics.misses)
  },
  {
    key: "hitRate",
    answerLabel: "Hit rate answer",
    resultLabel: "Hit rate",
    format: (statistics) => `${(statistics.hitRate.value * 100).toFixed(2)}%`
  },
  {
    key: "missRate",
    answerLabel: "Miss rate answer",
    resultLabel: "Miss rate",
    format: (statistics) => `${(statistics.missRate.value * 100).toFixed(2)}%`
  },
  {
    key: "memoryBits",
    answerLabel: "Memory bits answer",
    resultLabel: "Memory bits",
    format: (statistics) => (statistics.memoryBits === undefined ? "" : String(statistics.memoryBits))
  },
  {
    key: "usedEntries",
    answerLabel: "Used entries answer",
    resultLabel: "Used entries",
    format: (statistics) => String(statistics.usedEntries)
  },
  {
    key: "aliasingEvents",
    answerLabel: "Aliasing events answer",
    resultLabel: "Aliasing events",
    format: (statistics) => String(statistics.aliasingEvents)
  }
];

export interface ConfigurationPanelProps {
  readonly templates: readonly TemplateOption[];
  readonly selectedTemplateId: string;
  readonly selectedVariantId: string;
  readonly activeTitle: string;
  readonly activeStatement: string;
  readonly activeVariantTitle: string;
  readonly traceCount: number;
  readonly predictorConfigSource: string;
  readonly predictorConfigError?: string;
  readonly statAnswerInputs: Record<StatisticKey, string>;
  readonly tableAnswerSource: string;
  readonly tableAnswerError?: string;
  readonly correctionReport?: CorrectionReport;
  readonly statistics?: StatisticsSet;
  readonly onSelectTemplate: (value: string) => void;
  readonly onSelectVariant: (value: string) => void;
  readonly onPredictorConfigSourceChange: (value: string) => void;
  readonly onTableAnswerSourceChange: (value: string) => void;
  readonly onStatAnswerChange: (key: StatisticKey, value: string) => void;
  readonly onCheckAnswers: () => void;
  readonly onCalculateStats: () => void;
}

export function ConfigurationPanel({
  templates,
  selectedTemplateId,
  selectedVariantId,
  activeTitle,
  activeStatement,
  activeVariantTitle,
  traceCount,
  predictorConfigSource,
  predictorConfigError,
  statAnswerInputs,
  tableAnswerSource,
  tableAnswerError,
  correctionReport,
  statistics,
  onSelectTemplate,
  onSelectVariant,
  onPredictorConfigSourceChange,
  onTableAnswerSourceChange,
  onStatAnswerChange,
  onCheckAnswers,
  onCalculateStats
}: ConfigurationPanelProps) {
  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId) ?? templates[0];
  return (
    <Box>
      <Stack spacing={1.25}>
        <Typography component="h2" variant="h2">
          Session setup
        </Typography>
        <FormControl fullWidth size="small">
          <InputLabel id="template-label">Template</InputLabel>
          <Select
            labelId="template-label"
            label="Template"
            value={selectedTemplateId}
            onChange={(event) => onSelectTemplate(event.target.value)}
          >
            {templates.map((template) => (
              <MenuItem key={template.id} value={template.id}>
                {template.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField label="Session" size="small" value={activeTitle} InputProps={{ readOnly: true }} />
        <FormControl fullWidth size="small">
          <InputLabel id="variant-label">Variant</InputLabel>
          <Select
            labelId="variant-label"
            label="Variant"
            value={selectedVariantId}
            onChange={(event) => onSelectVariant(event.target.value)}
          >
            {selectedTemplate?.variants.map((variant) => (
              <MenuItem key={variant.id} value={variant.id}>
                {variant.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField label="Active variant" size="small" value={activeVariantTitle} InputProps={{ readOnly: true }} />
        <CompactAccordion title="Predictor">
          <TextField
            label="Predictor configuration JSON"
            size="small"
            multiline
            minRows={8}
            value={predictorConfigSource}
            onChange={(event) => onPredictorConfigSourceChange(event.target.value)}
            error={predictorConfigError !== undefined}
            helperText={predictorConfigError ?? "Changes reset the current trace after the configuration is valid."}
            InputProps={{
              sx: { fontFamily: '"Roboto Mono", Consolas, monospace', fontSize: "0.8125rem" }
            }}
          />
          <TextField
            label="Statement"
            size="small"
            value={activeStatement}
            multiline
            minRows={3}
            InputProps={{ readOnly: true }}
          />
        </CompactAccordion>
        <Divider sx={{ borderColor: visualTokens.color.border }} />
        <CompactAccordion title="Answers">
          <TextField
            label="Table answers"
            size="small"
            multiline
            minRows={3}
            value={tableAnswerSource}
            onChange={(event) => onTableAnswerSourceChange(event.target.value)}
            InputProps={{
              sx: { fontFamily: '"Roboto Mono", Consolas, monospace', fontSize: "0.8125rem" }
            }}
          />
          {statisticFields.map((field) => (
            <TextField
              key={field.key}
              label={field.answerLabel}
              size="small"
              value={statAnswerInputs[field.key]}
              onChange={(event) => onStatAnswerChange(field.key, event.target.value)}
            />
          ))}
          <Button
            startIcon={<CheckIcon />}
            variant="outlined"
            onClick={onCheckAnswers}
            disabled={traceCount === 0}
          >
            Check
          </Button>
          {tableAnswerError ? <Alert severity="warning">{tableAnswerError}</Alert> : undefined}
          {correctionReport ? (
            <Alert
              severity={
                correctionReport.summary.total > 0 && correctionReport.summary.correct === correctionReport.summary.total
                  ? "success"
                  : "info"
              }
            >
              {correctionReport.summary.correct} / {correctionReport.summary.total} correct answers
            </Alert>
          ) : undefined}
        </CompactAccordion>
        <CompactAccordion title="Statistics">
          {statisticFields.map((field) => (
            <TextField
              key={field.resultLabel}
              label={field.resultLabel}
              size="small"
              value={statistics ? field.format(statistics) : ""}
              InputProps={{ readOnly: true }}
            />
          ))}
          <Button variant="contained" onClick={onCalculateStats} disabled={traceCount === 0}>
            Calculate
          </Button>
        </CompactAccordion>
      </Stack>
    </Box>
  );
}

function CompactAccordion({
  title,
  defaultExpanded = false,
  children
}: {
  readonly title: string;
  readonly defaultExpanded?: boolean;
  readonly children: ReactNode;
}) {
  return (
    <Accordion
      defaultExpanded={defaultExpanded}
      disableGutters
      elevation={0}
      sx={{
        bgcolor: "transparent",
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        "&::before": { display: "none" }
      }}
    >
      <AccordionSummary
        aria-controls={`${title.toLowerCase()}-panel`}
        expandIcon={<Box component="span" aria-hidden="true">v</Box>}
        id={`${title.toLowerCase()}-header`}
        sx={{
          minHeight: 36,
          px: 1,
          "& .MuiAccordionSummary-content": {
            my: 0.5
          }
        }}
      >
        <Typography component="h2" variant="h2">
          {title}
        </Typography>
      </AccordionSummary>
      <AccordionDetails id={`${title.toLowerCase()}-panel`} sx={{ px: 1, pt: 0 }}>
        <Stack spacing={1.25}>{children}</Stack>
      </AccordionDetails>
    </Accordion>
  );
}
