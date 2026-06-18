import type { Components, Theme } from "@mui/material/styles";
import { visualTokens } from "./tokens";

export const componentOverrides: Components<Omit<Theme, "components">> = {
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        color: visualTokens.color.text,
        backgroundColor: visualTokens.color.background
      },
      "*": {
        scrollbarColor: `${visualTokens.color.borderStrong} ${visualTokens.color.surfaceSoft}`,
        scrollbarWidth: "thin"
      },
      "*::-webkit-scrollbar": {
        height: 10,
        width: 10
      },
      "*::-webkit-scrollbar-track": {
        background: visualTokens.color.surfaceSoft
      },
      "*::-webkit-scrollbar-thumb": {
        backgroundColor: visualTokens.color.borderStrong,
        border: `2px solid ${visualTokens.color.surfaceSoft}`,
        borderRadius: 999
      },
      "*::-webkit-scrollbar-thumb:hover": {
        backgroundColor: visualTokens.color.textMuted
      }
    }
  },
  MuiButtonBase: {
    styleOverrides: {
      root: {
        "&.Mui-focusVisible": {
          boxShadow: visualTokens.focusRing,
          outline: `1px solid ${visualTokens.color.accent}`,
          outlineOffset: 2
        }
      }
    }
  },
  MuiButton: {
    defaultProps: {
      disableElevation: true
    },
    styleOverrides: {
      root: {
        borderRadius: visualTokens.radius.control,
        minHeight: 36,
        textTransform: "none"
      },
      containedPrimary: {
        backgroundColor: visualTokens.color.accent,
        "&:hover": {
          backgroundColor: visualTokens.color.accentHover
        }
      },
      outlined: {
        borderColor: visualTokens.color.borderStrong,
        color: visualTokens.color.text,
        "&:hover": {
          backgroundColor: visualTokens.color.surfaceSoft,
          borderColor: visualTokens.color.accent
        }
      }
    }
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        borderRadius: visualTokens.radius.control
      }
    }
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        backgroundColor: visualTokens.color.surface,
        borderRadius: visualTokens.radius.control,
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
          borderColor: visualTokens.color.accent,
          boxShadow: visualTokens.focusRing
        }
      },
      notchedOutline: {
        borderColor: visualTokens.color.border
      }
    }
  },
  MuiInputLabel: {
    styleOverrides: {
      root: {
        color: visualTokens.color.textMuted,
        "&.Mui-focused": {
          color: visualTokens.color.accent
        }
      }
    }
  },
  MuiMenu: {
    styleOverrides: {
      paper: {
        border: `1px solid ${visualTokens.color.border}`,
        boxShadow: visualTokens.shadow.popover
      }
    }
  },
  MuiMenuItem: {
    styleOverrides: {
      root: {
        minHeight: 36
      }
    }
  },
  MuiPaper: {
    styleOverrides: {
      outlined: {
        borderColor: visualTokens.color.border
      }
    }
  },
  MuiTableCell: {
    styleOverrides: {
      root: {
        borderColor: visualTokens.color.border,
        padding: "8px 10px"
      },
      head: {
        backgroundColor: visualTokens.color.surfaceMuted,
        color: visualTokens.color.text,
        fontWeight: 600
      }
    }
  },
  MuiTab: {
    styleOverrides: {
      root: {
        letterSpacing: 0,
        minHeight: 40,
        textTransform: "none"
      }
    }
  },
  MuiTabs: {
    styleOverrides: {
      indicator: {
        backgroundColor: visualTokens.color.accent
      }
    }
  }
};
