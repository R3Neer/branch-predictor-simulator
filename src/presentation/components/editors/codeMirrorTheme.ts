import { defaultHighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { visualTokens } from "../../theme/tokens";

export const simulatorCodeMirrorTheme = [
  syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
  EditorView.theme({
    "&": {
      backgroundColor: visualTokens.color.surface,
      color: visualTokens.color.text,
      fontSize: "0.875rem"
    },
    "&.cm-focused": {
      outline: "none"
    },
    ".cm-content": {
      caretColor: visualTokens.color.accent,
      fontFamily: '"Roboto Mono", Consolas, monospace',
      minHeight: "240px",
      padding: "10px 0"
    },
    ".cm-line": {
      padding: "0 12px"
    },
    ".cm-gutters": {
      backgroundColor: visualTokens.color.surfaceSoft,
      borderRight: `1px solid ${visualTokens.color.border}`,
      color: visualTokens.color.textMuted
    },
    ".cm-activeLine": {
      backgroundColor: visualTokens.color.accentSoft
    },
    ".cm-activeLineGutter": {
      backgroundColor: visualTokens.color.accentSoft,
      color: visualTokens.color.accent
    },
    ".cm-scroller": {
      fontFamily: '"Roboto Mono", Consolas, monospace',
      maxHeight: "240px",
      overflow: "auto"
    },
    ".cm-tooltip": {
      border: `1px solid ${visualTokens.color.border}`,
      boxShadow: visualTokens.shadow.popover
    },
    ".cm-semantic-address": {
      color: visualTokens.color.textMuted
    },
    ".cm-semantic-branch-id": {
      color: visualTokens.color.accent,
      fontWeight: 700
    },
    ".cm-semantic-comment": {
      color: visualTokens.color.textMuted,
      fontStyle: "italic"
    },
    ".cm-semantic-immediate": {
      color: visualTokens.color.counter
    },
    ".cm-semantic-keyword": {
      color: visualTokens.color.accent,
      fontWeight: 700
    },
    ".cm-semantic-label": {
      color: visualTokens.color.history,
      fontWeight: 700
    },
    ".cm-semantic-mnemonic": {
      color: visualTokens.color.accent,
      fontWeight: 700
    },
    ".cm-semantic-option": {
      color: visualTokens.color.aliasing
    },
    ".cm-semantic-range": {
      color: visualTokens.color.counter
    },
    ".cm-semantic-register": {
      color: visualTokens.color.history
    },
    ".cm-semantic-repetition": {
      color: visualTokens.color.aliasing,
      fontWeight: 700
    },
    "@media (min-width: 1200px)": {
      ".cm-content": {
        minHeight: "260px"
      },
      ".cm-scroller": {
        maxHeight: "260px"
      }
    }
  })
];
