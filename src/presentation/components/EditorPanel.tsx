import { Box, Paper, TextField, Typography } from "@mui/material";
import { visualTokens } from "../theme/tokens";

export interface EditorPanelProps {
  readonly title: string;
  readonly value: string;
  readonly readOnly?: boolean;
  readonly onChange?: (value: string) => void;
}

export function EditorPanel({ title, value, readOnly = false, onChange }: EditorPanelProps) {
  return (
    <Paper variant="outlined" sx={{ overflow: "hidden" }}>
      <Box
        sx={{
          bgcolor: visualTokens.color.surfaceMuted,
          borderBottom: 1,
          borderColor: "divider",
          px: 1.5,
          py: 1
        }}
      >
        <Typography component="h2" variant="h2">
          {title}
        </Typography>
      </Box>
      <TextField
        multiline
        fullWidth
        minRows={8}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        inputProps={{ "aria-label": title }}
        InputProps={{
          readOnly,
          sx: {
            fontFamily: '"Roboto Mono", Consolas, monospace',
            fontSize: "0.875rem",
            alignItems: "flex-start"
          }
        }}
      />
    </Paper>
  );
}
