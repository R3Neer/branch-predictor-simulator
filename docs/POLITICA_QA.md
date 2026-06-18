# QA And Test Policy

This document defines how the simulator is tested and what must be true before a block of work is accepted.

## 1. Document Authority

1. `docs/REQUISITOS.md` is the highest source of truth.
2. `docs/ARQUITECTURA.md` defines the technical architecture.
3. `docs/POLITICA_QA.md` defines testing and QA policy.
4. `docs/DECISIONES_TECNICAS_Y_AGENTES.md` and `.codex/AGENTES.md` derive from the previous documents.
5. README, scaffold, and code must obey all of the above.

## 2. Principles

- Domain, application, and infrastructure classes need unit or integration tests appropriate to their risk.
- UI behavior needs component tests when it owns meaningful interaction.
- Critical user flows need Playwright before v1 is declared complete.
- Tests verify observable behavior and layer contracts, not accidental implementation details.
- Official templates are validated by the same engine used for manual sessions.
- A behavior change must be documented before tests are updated to accept it.

## 3. Quality Gates

| Gate | Tool | Purpose |
| --- | --- | --- |
| Unit/domain | Vitest | Predictors, indexers, parsers, counters, simulation, stats, correction |
| Application integration | Vitest | Service/use-case collaboration with real domain and fake ports |
| Infrastructure integration | Vitest | YAML, Zod schemas, exporters, templates |
| UI components | Testing Library | Rendering, actions, visibility, and error states |
| E2E | Playwright | Load template, simulate, check answers, import/export |
| Static checks | TypeScript, ESLint, Prettier | Types, layer hygiene, formatting |

Required local commands before closing code changes:

```powershell
npm.cmd test
npm.cmd run test:e2e
npm.cmd run lint
npm.cmd run build
```

## 4. Current QA Status

Synchronization date: 2026-06-18.

Covered today:

- Saturating counters, predictors, history registers, and indexers.
- Simulation engine, sequence expansion, and statistics.
- C/RISC-V translators/parsers and manual sequence parser.
- Statistic and table answer checking.
- Table/calculation projectors.
- YAML, Zod schemas, and official template validation.
- CSV/Markdown exporters.
- Zustand store and `DashboardShell`.
- Playwright e2e flows covering run, solution reveal, calculation reveal, answer checking, Markdown export, YAML export, manual sequence editing, YAML import, and template/variant selection.

Pending for v1:

- Broader Playwright coverage for responsive smoke checks.
- Visual, responsive, and basic accessibility review.
- Tests around final English-only copy if localization infrastructure is expanded.

Tracked separately:

- Review npm audit findings and decide package upgrades or mitigations without using forced breaking updates blindly.

## 5. Minimum Coverage By Piece

| Piece | Minimum Test |
| --- | --- |
| Value object or pure utility | Unit cases for normal, edge, and invalid input |
| Predictor | Prediction, update, saturation, history/indexing, and emitted trace |
| Indexer | Index calculation and aliasing-relevant cases |
| Parser/translator | Supported instructions/forms and clear errors |
| Simulation engine | Step/full run, loop expansion, snapshots |
| Statistics | Hits, misses, rates, memory, used entries, aliasing |
| Correction rule/parser | Correct, incorrect, tolerance, and error cases |
| Application service/use case | Integration with real domain and fake ports |
| Infrastructure adapter | Round trip or stable export |
| UI component | Render, actions, state, and important accessibility affordances |
| Full flow | Playwright e2e |

## 6. Exam/Solution Risk Matrix

- Exam mode must not reveal official solutions before checking.
- Exam mode must not reveal calculations before checking.
- Statistics must remain hidden until calculation/checking is requested.
- Solution mode can reveal canonical trace data derived from the engine.

## 7. YAML Risk Matrix

- Synchronized session: saves C and RISC-V.
- Desynchronized session: saves RISC-V and omits C.
- Derived table data is not saved.
- Calculated statistics are not saved.
- Imported/exported sessions preserve editable input only.

## 8. Agent QA Policy

The lead engineer owns final quality. Agents assist but do not replace local verification.

Roles:

- `Unit QA`: Vitest tests for domain, application, and infrastructure.
- `Integration QA`: use cases, fake ports, templates, and cross-layer flows.
- `E2E QA`: Playwright tests once the UI flow is executable.
- `QA reviewer`: read-only review of coverage, risks, layer dependencies, and requirement gaps.

Workers must report changed paths and executed tests. Explorers must not edit files unless explicitly assigned.
