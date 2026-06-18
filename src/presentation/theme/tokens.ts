export const visualTokens = {
  color: {
    background: "#eef2f6",
    surface: "#ffffff",
    surfaceSoft: "#f8fafc",
    surfaceMuted: "#eef3f3",
    text: "#17202a",
    textMuted: "#64748b",
    border: "#d7dee8",
    borderStrong: "#b8c2d0",
    accent: "#006c7a",
    accentHover: "#005866",
    accentSoft: "#d9f3f6",
    danger: "#b42318",
    dangerSoft: "#fce8e6",
    success: "#287d3c",
    successSoft: "#e8f5eb",
    warning: "#9a6500",
    warningSoft: "#fff4db",
    hit: "#287d3c",
    miss: "#b42318",
    history: "#5b5fc7",
    counter: "#7a4e13",
    aliasing: "#9a6500"
  },
  shadow: {
    table: "0 10px 32px rgba(15, 23, 42, 0.08)",
    popover: "0 16px 40px rgba(15, 23, 42, 0.14)"
  },
  radius: {
    control: 8,
    shell: 10
  },
  focusRing: "0 0 0 3px rgba(0, 108, 122, 0.24)"
} as const;
