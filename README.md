# Branch Predictor Simulator

Local web application for studying and solving branch predictor exercises from the Computer Structure course at Universidad Complutense de Madrid.

The app can work from didactic C, RISC-V, or a manual branch sequence. It runs canonical simulations, projects dynamic tables, calculates statistics, checks user answers, and exports sessions/results.

## Source Of Truth

The living project documentation is:

- `docs/REQUISITOS.md`: v1 functional scope and requirements.
- `docs/ARQUITECTURA.md`: domain model, layers, contracts, and design patterns.
- `docs/POLITICA_QA.md`: test policy, quality gates, and QA responsibilities.
- `docs/DECISIONES_TECNICAS_Y_AGENTES.md`: technical decisions, tools, and Codex agents.
- `.codex/AGENTES.md`: operational cheat sheet for subagents.
- `ref_docs/Problems.pdf`: official branch predictor exercises.
- `ref_docs/Theory.pdf`: course reference material.

`docs/REQUISITOS.md` and `docs/ARQUITECTURA.md` drive implementation decisions.

## Current Status

Estimated v1 progress: 50-55%.

Implemented:

- Vite + React + TypeScript scaffold.
- Layered architecture: `domain`, `application`, `infrastructure`, and `presentation`.
- Canonical simulation engine with partial/full execution, loop expansion, and trace snapshots.
- Main v1 predictors: one-level, two-level `(n,m)`, global correlated, `gshare`, `gselect`, and local correlated.
- LSB, manual, XOR, and concatenation indexers.
- Trace-derived statistics: hits, misses, rates, memory, used entries, and aliasing.
- Table projection, compact calculations, CSV/Markdown table export, and YAML session export/import.
- Initial RISC-V parser for conditional branches, labels, addresses, and comments.
- Didactic C translator for loop/branch exercises; it is not a general C compiler.
- Editable manual sequence text format with `B1..Bn`, `T/NT`, optional address/index, comments, and repeated ranges.
- Statistic and table answer checking.
- Official templates for exercises 1, 2, 3, 4, 5, and 7 as versioned, engine-verified data.
- Functional MUI/Zustand UI for templates, variants, editors, TanStack-powered table, statistics, checking, calculations, and import/export.
- Playwright e2e coverage for run, reveal, check, Markdown export, YAML export, manual sequence editing, YAML import, and template/variant selection.

Remaining v1 work:

- Add richer official table projections for templates 2, 3, and 4.
- Complete the visual predictor configurator and expected UI flows.
- Replace text fields with Monaco where it improves the workflow.
- Complete English-only user-facing copy and future i18n infrastructure only when explicitly requested.
- Broaden Playwright coverage for responsive smoke checks.
- Finish visual QA, responsive checks, basic accessibility, and release checklist.

## Stack

- TypeScript
- Vite
- React
- MUI Material UI
- Zustand
- TanStack Table
- Monaco Editor, installed for code editors
- Zod
- yaml
- i18next + react-i18next, installed for future localization work
- Vitest
- Testing Library
- Playwright
- ESLint + Prettier

## Local Development

```powershell
npm.cmd install
npm.cmd run dev
npm.cmd test
npm.cmd run test:e2e
npm.cmd run lint
npm.cmd run build
```

Use `npm.cmd` on Windows if PowerShell blocks the `npm.ps1` wrapper.

Required gates before closing code changes:

```powershell
npm.cmd test
npm.cmd run test:e2e
npm.cmd run lint
npm.cmd run build
```

## Structure

```text
src/
+-- domain/
|   +-- correction/
|   +-- indexing/
|   +-- predictors/
|   +-- shared/
|   +-- simulation/
|   +-- source/
|   +-- stats/
+-- application/
|   +-- projectors/
|   +-- SimulationSessionService.ts
+-- infrastructure/
|   +-- export/
|   +-- persistence/
|   +-- predictors/
|   +-- templates/
+-- presentation/
    +-- components/
    +-- screens/
    +-- stores/
    +-- theme/
docs/
ref_docs/
```

Key rule: the domain does not depend on React, MUI, Zustand, YAML, the DOM, or browser storage. The UI calls the application layer and consumes projections derived from the canonical trace.
