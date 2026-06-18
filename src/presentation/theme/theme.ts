import { createTheme } from "@mui/material/styles";
import { componentOverrides } from "./componentOverrides";
import { visualTokens } from "./tokens";

export const theme = createTheme({
  components: componentOverrides,
  palette: {
    mode: "light",
    primary: {
      main: visualTokens.color.accent
    },
    secondary: {
      main: visualTokens.color.counter
    },
    background: {
      default: visualTokens.color.background,
      paper: visualTokens.color.surface
    },
    success: {
      main: visualTokens.color.success
    },
    error: {
      main: visualTokens.color.danger
    },
    text: {
      primary: visualTokens.color.text,
      secondary: visualTokens.color.textMuted
    },
    divider: visualTokens.color.border
  },
  shape: {
    borderRadius: visualTokens.radius.control
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: "1.25rem",
      fontWeight: 650,
      letterSpacing: 0,
      lineHeight: 1.2
    },
    h2: {
      fontSize: "0.95rem",
      fontWeight: 650,
      letterSpacing: 0,
      lineHeight: 1.25
    },
    h3: {
      fontSize: "0.85rem",
      fontWeight: 650,
      letterSpacing: 0,
      lineHeight: 1.25
    },
    body2: {
      color: visualTokens.color.textMuted
    },
    button: {
      letterSpacing: 0,
      textTransform: "none"
    }
  }
});
