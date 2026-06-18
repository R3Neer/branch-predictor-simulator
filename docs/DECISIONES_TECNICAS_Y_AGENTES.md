# Technical Decisions And Codex Agents

This document records the project stack and the agent operating model used to implement the simulator described in `docs/REQUISITOS.md` and `docs/ARQUITECTURA.md`.

## 1. Executive Decision

The simulator is a local web application with a pure TypeScript simulation core, a React UI, and a layered modular structure.

This choice gives us:

- One main language across domain, application, infrastructure, and UI.
- Fast engine tests without a browser.
- Strong typing for predictor configs, traces, and YAML.
- Simple local distribution.
- A path toward future Tournament, TAGE, pipeline, ROB, and return address stack support.

## 2. Stack

| Area | Technology | Decision |
| --- | --- | --- |
| Language | TypeScript | Main product language |
| Build/frontend | Vite | Lightweight local web app |
| UI | React | Ecosystem for tables, editors, state, and tests |
| Components | MUI Material UI | Fits the requested Material-inspired interface |
| UI state | Zustand | Explicit local session state |
| Tables | TanStack Table | Main simulation table rendering |
| Code editors | MUI text fields | Monaco is deferred until an editor-specific need justifies the bundle cost |
| Validation | Zod | YAML, templates, configs, forms |
| YAML | yaml | User-visible import/export |
| Localization | Static English copy | UI switching is deferred; current project text must remain English-only |
| CSV export | Custom exporter | Simple and trace-projection based |
| Markdown export | Custom exporter | Simple and deterministic |
| Unit tests | Vitest | Domain and application tests |
| UI tests | Testing Library | Component behavior |
| E2E tests | Playwright | Critical browser flows |
| Lint/format | ESLint + Prettier | Baseline consistency |
| Documentation | Markdown + Mermaid where useful | Versioned with the repo |

No backend, Electron, or Tauri package is part of v1.

## 3. Document Authority

1. `docs/REQUISITOS.md`: highest source of truth.
2. `docs/ARQUITECTURA.md`: technical architecture.
3. `docs/POLITICA_QA.md`: testing and QA policy.
4. `docs/DECISIONES_TECNICAS_Y_AGENTES.md` and `.codex/AGENTES.md`: operational decisions.
5. README, scaffold, and code.

If documents conflict, the higher document wins.

## 4. Current Project Structure

```text
.
+-- src/
|   +-- domain/
|   |   +-- correction/
|   |   +-- indexing/
|   |   +-- predictors/
|   |   +-- simulation/
|   |   +-- stats/
|   |   +-- source/
|   +-- application/
|   |   +-- projectors/
|   |   +-- SimulationSessionService.ts
|   +-- infrastructure/
|   |   +-- export/
|   |   +-- persistence/
|   |   +-- predictors/
|   |   +-- templates/
|   +-- presentation/
|   |   +-- components/
|   |   +-- screens/
|   |   +-- stores/
|   |   +-- theme/
+-- docs/
+-- ref_docs/
+-- .codex/
+-- package.json
```

Potential future folders such as `application/use-cases`, `application/ports`, and `infrastructure/i18n` should be added only when they reduce real complexity.

## 5. V1 Decisions

- Step backward is allowed through snapshots/trace history if it stays simple.
- Image export is deferred to v1.1 unless it becomes cheap.
- Default percentage tolerance is `0.5%` absolute unless a template overrides it.
- Initial RISC-V parser supports the conditional branches listed in requirements plus labels, optional addresses, and comments.
- The C translator is didactic, not a real compiler.
- Official templates are versioned data validated through Zod and the real engine.
- All project text and user-facing copy must be English-only.
- Comments should explain why unusual code exists, not what obvious code does.

## 6. Agent Team

Use Codex agents only for separable work. The lead engineer owns architecture, integration, and final decisions.

| Agent | Type | Responsibility | When To Use |
| --- | --- | --- | --- |
| Documentation Guardian | `explorer` | Check consistency between requirements, architecture, QA policy, operations, and code | Before scope or architecture-sensitive changes |
| SOLID And Patterns Guardian | `explorer` | Review SRP, OCP, LSP, ISP, DIP, documented patterns, layer dependencies, and structural debt | During domain/application milestones and before closing large blocks |
| Architect Reviewer | `explorer` | Review broad technical risk and architecture fit | Before major changes |
| Simulation Engine | `worker` | `src/domain/predictors`, simulation, stats | When contracts and tests are clear |
| Academic UX Design | `explorer` | Flow, hierarchy, exam/solution mode, empty states, errors, teaching clarity | Before new screens or complex interaction |
| Material Visual QA | `explorer` or `worker` | MUI coherence, table density, responsive behavior, contrast, screenshots | Before closing UI milestones |
| Material UI | `worker` | `src/presentation/**` | When application contracts are stable |
| Persistence | `worker` | YAML, Zod, session repositories | When persistence contracts are clear |
| Official Templates | `worker` | Template data derived from `ref_docs/Problems.pdf` | When schema is stable |
| Unit QA | `worker` | Vitest unit tests | Alongside new classes/functions |
| Integration QA | `worker` | Use-case, YAML, template, exporter tests | Alongside adapters and flows |
| E2E QA | `worker` | Playwright flows | When UI flows are ready |
| QA Reviewer | `explorer` | Coverage, risks, layer dependencies, requirement gaps | Before closing milestones |
| English Copy | `worker` | User-facing copy and documentation language hygiene | When UI text changes |

## 7. Agent Rules

- Workers get clear file ownership.
- Workers must not edit design/governance docs unless explicitly assigned by the lead after user approval.
- Explorers do not edit files unless explicitly assigned.
- No agent reverts another agent's work.
- Implementation workers must include relevant tests.
- UI flows need component tests and Playwright coverage for critical paths.
- The lead engineer integrates, resolves conflicts, runs verification, and decides whether the block is accepted.

## 8. Recommended Prompts

Worker:

```text
You are a Codex worker for this branch predictor simulator.
Do not revert unrelated changes.

Responsibility: [files or module].
Goal: [verifiable outcome].
Constraints:
- Follow docs/ARQUITECTURA.md and docs/POLITICA_QA.md.
- Keep TypeScript strict.
- Keep domain logic out of React.
- Keep dependencies inward: presentation -> application -> domain.
- Keep all project text in English.
- Add/update tests for changed behavior.

Deliver:
- Changed paths.
- Tests executed and result.
```

Explorer:

```text
You are a Codex explorer.
Question: [specific review question].
Do not modify files.
Return prioritized findings, risks, and file/document references.
```
