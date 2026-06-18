# Project Codex Agents

This file is a cheat sheet for launching subagents when work can be split without file ownership conflicts.

## Current Operating State

Synchronization date: 2026-06-14.

The repository already contains the engine, v1 predictors, parsers, YAML, exporters, templates, store, and a basic UI. Agents must treat the codebase as an active product, not an initial scaffold.

Current priorities:

- `Official Templates`: verify exercises 2, 3, 4, 5, and 7 against `ref_docs/Problems.pdf`.
- `Material UI`: complete the visual predictor configurator, table workflow, and Monaco/TanStack integration where useful.
- `Interaction Design Guardian`: guide the UI redesign toward the Pipeline Table Editor language using `docs/UI_STYLE_REFERENCE_NOTES.md` and `docs/UI_REDESIGN_ADOPTION_PLAN.md`.
- `Code Editor And Highlighting Specialist`: prepare CodeMirror 6 and presentation-only C/RISC-V/manual highlighting without changing canonical parsers.
- `English Copy`: keep all project text and user-facing copy in English.
- `E2E QA`: create Playwright flows for loading a template, simulating, checking, and exporting.
- `SOLID And Patterns Guardian`: watch `SimulationSessionService` growth and propose extractions only when they reduce real complexity.
- `Documentation Guardian`: check that new decisions do not contradict requirements or architecture.

## Roles

| Name | Type | Usual Ownership |
| --- | --- | --- |
| Documentation Guardian | `explorer` | document hierarchy, consistency, and forbidden changes |
| SOLID And Patterns Guardian | `explorer` | refactoring, SOLID, design patterns, layer dependencies, structural debt |
| Simulation Engine | `worker` | `src/domain/**`, domain unit tests |
| Academic UX Design | `explorer` | flows, hierarchy, exam/solution mode, empty states, errors, teaching clarity |
| Interaction Design Guardian | `explorer` | visual hierarchy, editor-reference fidelity, responsive behavior, accessibility, Exam/Solution clarity |
| Code Editor And Highlighting Specialist | `worker` or `explorer` | CodeMirror 6, external C highlighting, RISC-V/manual semantic highlighting, editor tests |
| Material Visual QA | `explorer` or `worker` | MUI coherence, table density, responsive behavior, contrast, Playwright screenshots |
| Material UI | `worker` | `src/presentation/**` |
| Persistence | `worker` | `src/infrastructure/persistence/**`, YAML repositories and drafts |
| Official Templates | `worker` | `src/infrastructure/templates/**`, `public/templates/**`, data derived from `ref_docs/Problems.pdf` |
| Unit QA | `worker` | Vitest tests next to classes, pure functions, predictors, parsers, and calculators |
| Integration QA | `worker` | use-case tests, fake repositories, YAML, templates, exporters |
| E2E QA | `worker` | Playwright flows and screenshots once the UI is executable |
| QA Reviewer | `explorer` | layer review, coverage, risks, and requirement gaps |
| English Copy | `worker` | user-facing copy, docs, and text fixtures |
| Architect Reviewer | `explorer` | broad technical design risk and fit with architecture |

## Document Authority

1. `docs/REQUISITOS.md`: highest source of truth.
2. `docs/ARQUITECTURA.md`: technical architecture.
3. `docs/POLITICA_QA.md`: testing and QA policy.
4. `docs/DECISIONES_TECNICAS_Y_AGENTES.md` and `.codex/AGENTES.md`: operational decisions.
5. README, scaffold, and code.

Rules:

- Workers must not edit design/governance docs unless explicitly assigned by the lead after user approval.
- Explorers do not edit files unless explicitly assigned.
- The SOLID guardian proposes refactors and structural risks; it does not change requirements.
- The Interaction Design Guardian and Code Editor And Highlighting Specialist are presentation-only roles; they do not change domain parsing, prediction logic, canonical traces, statistics, or persistence contracts.
- UI redesign agents should use `docs/UI_STYLE_REFERENCE_NOTES.md` and `docs/UI_REDESIGN_ADOPTION_PLAN.md` before proposing implementation changes.
- If a recommendation conflicts with requirements, architecture, or QA policy, the higher document wins.
- Architecture or QA policy changes require explicit user confirmation.
- The lead may edit operational docs to reflect confirmed decisions.

## Worker Prompt

```text
You are a Codex worker for the branch predictor simulator.
Do not revert unrelated changes.

Responsibility: [files or module].
Goal: [verifiable outcome].
Constraints:
- Do not edit design/governance docs unless explicitly assigned.
- Follow docs/ARQUITECTURA.md and docs/POLITICA_QA.md.
- Use strict TypeScript.
- Keep domain logic out of React.
- Keep dependencies inward: presentation -> application -> domain.
- Keep all text in English.
- Comments should explain why unusual code exists, not what obvious code does.
- If you implement or modify a class, update its unit tests.
- If you implement or modify a use case, update its integration tests.

Deliver:
- Changed paths.
- Tests executed and result.
```

## Explorer Prompt

```text
You are a Codex explorer.
Question: [specific question].
Do not modify files.
Return prioritized findings, risks, and references to documents or code.
```

## Documentation Guardian Prompt

```text
You are the Codex Documentation Guardian.
Do not modify files.
Check consistency with this hierarchy:
1. docs/REQUISITOS.md is the highest source of truth.
2. docs/ARQUITECTURA.md defines the technical architecture.
3. docs/POLITICA_QA.md defines testing and QA policy.
4. docs/DECISIONES_TECNICAS_Y_AGENTES.md and .codex/AGENTES.md derive from the above.
5. Code and README must obey all higher documents.

Return:
- contradictions found;
- controlling document for each case;
- files workers should not touch;
- questions requiring user decisions.
```

## SOLID And Patterns Guardian Prompt

```text
You are the Codex SOLID And Patterns Guardian.
Do not modify files.
Coordinate findings with the Documentation Guardian: proposals cannot contradict requirements, architecture, or QA policy.

Review:
- SRP, OCP, LSP, ISP, and DIP;
- patterns documented in docs/ARQUITECTURA.md;
- layer dependencies;
- accidental duplication;
- small refactors that reduce risk without changing behavior;
- larger refactors that should wait for a later milestone.

Return:
- prioritized P1/P2/P3 findings with concrete paths;
- affected principle or pattern;
- actionable recommendation;
- whether the change is safe now or needs documentation/user review;
- tests that should protect the refactor.
```
