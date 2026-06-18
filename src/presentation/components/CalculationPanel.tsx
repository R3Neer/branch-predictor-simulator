import FunctionsIcon from "@mui/icons-material/Functions";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import type { CalculationView, SessionMode } from "../../application";

export interface CalculationPanelProps {
  readonly mode: SessionMode;
  readonly traceCount: number;
  readonly calculationViews?: readonly CalculationView[];
  readonly onRevealCalculations: () => void;
}

export function CalculationPanel({
  mode,
  traceCount,
  calculationViews,
  onRevealCalculations
}: CalculationPanelProps) {
  if (mode !== "solution") {
    return null;
  }

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Typography component="h2" variant="h2" sx={{ flexGrow: 1 }}>
            Calculations
          </Typography>
          <Button
            startIcon={<FunctionsIcon />}
            variant="outlined"
            onClick={onRevealCalculations}
            disabled={traceCount === 0}
          >
            Show calculations
          </Button>
        </Stack>
        {calculationViews?.map((view, index) => (
          <Box key={`${view.summary}-${index}`} sx={{ borderTop: 1, borderColor: "divider", pt: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              Step {index + 1}: {view.summary}
            </Typography>
            {view.sections.map((section) => (
              <Box key={`${index}-${section.title}`} sx={{ mt: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {section.title}
                </Typography>
                {section.rows.map((row) => (
                  <Typography key={`${row.label}-${row.operation}`} variant="body2" color="text.secondary">
                    {formatCalculationRow(row)}
                  </Typography>
                ))}
              </Box>
            ))}
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}

function formatCalculationRow(row: CalculationView["sections"][number]["rows"][number]) {
  return [row.label, row.valueBefore, row.operation, row.valueAfter].filter(Boolean).join(" -> ");
}
