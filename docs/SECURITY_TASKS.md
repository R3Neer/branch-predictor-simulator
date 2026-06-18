# Security Tasks

Synchronization date: 2026-06-18.

This file tracks dependency security work separately from v1 feature implementation. Do not run forced audit fixes without a dedicated decision.

## Current `npm audit` Summary

Command:

```powershell
npm.cmd audit --json
```

Initial result:

- Total vulnerabilities: 7.
- Critical: 1.
- High: 2.
- Moderate: 3.
- Low: 1.

After targeted overrides:

- Total vulnerabilities: 4.
- Critical: 1.
- High: 1.
- Moderate: 2.
- Low: 0.

After Vite/Vitest upgrade:

- Total vulnerabilities: 0.

## Findings

| Package | Severity | Path | Current decision |
| --- | --- | --- | --- |
| `vitest` | Resolved | Direct dev dependency through `vitest`, `vite-node`, and `vite` | Upgraded to `4.1.9` |
| `vite` | Resolved | Direct dev dependency and transitive through Vitest | Upgraded to `8.0.16` |
| `esbuild` | Resolved | Transitive through Vite | Covered by the Vite upgrade |
| `dompurify` | Resolved | Transitive through Monaco | Overridden to `3.4.11` |
| `monaco-editor` | Low | Transitive `dompurify` exposure | Review whether Monaco is still needed before v1 |
| `form-data` | Resolved | Transitive dependency | Overridden to `4.0.6` |

## V1 Policy

- Prefer targeted upgrades or npm `overrides`.
- Keep all gates green after any dependency change:
  - `npm.cmd test`
  - `npm.cmd run test:e2e`
  - `npm.cmd run lint`
  - `npm.cmd run build`
- Do not use `npm audit fix --force` unless a separate major-upgrade task explicitly approves it.

## Next Actions

1. Consider removing Monaco before v1 if plain text editors remain enough and Monaco is not used by the UI.
2. Re-run `npm.cmd audit` after each dependency block and update this file.
