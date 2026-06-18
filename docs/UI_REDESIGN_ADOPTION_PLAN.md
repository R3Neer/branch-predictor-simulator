# UI Redesign Adoption Plan

This document defines what the branch predictor simulator should borrow from the sibling `Pipeline Table Editor`, how CodeMirror 6 should enter the source editing experience, and how the next redesign work should be staged.

Reference notes:

- `docs/UI_STYLE_REFERENCE_NOTES.md`
- `D:\OneDrive\Documentos Samuel\Tablas procesador segmentado`
- CodeMirror 6 documentation: `https://codemirror.net/docs/`
- CodeMirror basic editor example: `https://codemirror.net/examples/basic/`

## Decision

Adopt the visual and interaction model of `Pipeline Table Editor` as the primary UI direction for this simulator.

The current simulator logic is strong enough for a v1 local release candidate. The weak point is presentation: too many panels compete at the same time, the table is not visually dominant enough, and source/configuration/checking/export surfaces appear with similar priority.

The redesign should keep the current domain/application architecture and replace the presentation composition with a calmer, denser, tool-like interface.

## What We Should Borrow

### 1. Tool Layout

Borrow:

- left sidebar as the main control surface,
- full-height workspace,
- table as the central artifact,
- minimal top chrome,
- low explanatory copy,
- compact command placement.

Adaptation for this simulator:

- Sidebar:
  - template selector,
  - variant selector,
  - Exam/Solution mode,
  - source editor tabs,
  - predictor configuration summary/edit access,
  - import/export,
  - answer/check/stat actions.
- Workspace:
  - source editor area,
  - simulation controls,
  - dynamic trace table,
  - optional result drawer/panel for calculations, exported output, and answer feedback.

The app should stop reading like a dashboard and start reading like a table-centered simulator.

### 2. Visual Tokens

Borrow the reference palette direction:

- cool gray page background,
- white surfaces,
- soft slate input backgrounds,
- teal accent,
- pale cyan accent background,
- restrained red danger,
- blue-gray borders,
- subtle table/floating shadows.

Initial token map:

| Token | Reference Value | Simulator Use |
| --- | --- | --- |
| `background` | `#eef2f6` | App shell background |
| `surface` | `#ffffff` | Sidebar and table shell |
| `surfaceSoft` | `#f8fafc` | Inputs, empty cells, quiet panels |
| `text` | `#17202a` | Main text |
| `mutedText` | `#64748b` | Labels, secondary metadata |
| `border` | `#d7dee8` | Cards, fields, table grid |
| `borderStrong` | `#b8c2d0` | Header separators, emphasized edges |
| `accent` | `#006c7a` | Primary actions, selected mode, focus |
| `accentSoft` | `#d9f3f6` | Hover/focus surfaces |
| `danger` | `#b42318` | Reset/clear/destructive actions |

Keep MUI, but make the MUI theme behave like the reference token system.

### 3. Component Micro-Language

Borrow:

- compact buttons,
- square icon buttons,
- soft hover shadow,
- visible focus rings,
- floating menus with compact rows,
- table shell with rounded border and subtle shadow,
- sticky table headers,
- custom scrollbars,
- state cells as colored pills.

Adaptation:

- `Step`, `Back`, `Run all`, and `Reset` stay near the table.
- `CSV`, `Markdown`, and `YAML` become one `Export` menu.
- YAML import moves into a collapsible/import panel.
- Calculations and exported content appear only after explicit actions.
- Check/stat feedback appears in a result panel, not as permanent vertical clutter.

### 4. Table-Centered Graphics

We should not add generic charts early. The dynamic table is the graphic.

Borrow from the editor:

- fixed table shell,
- sticky headers,
- horizontal scroll as a designed behavior,
- color-coded compact cells,
- cell-level semantic states,
- lightweight overlays/menus.

Simulator-specific table cells:

| Data | Visual Treatment |
| --- | --- |
| `T` / `NT` | compact outcome pills |
| Prediction | pill, hidden/blank in Exam until allowed |
| Hit | success pill |
| Miss | danger/warning pill |
| Counter bits | monospace bit pill |
| GHR/local history | monospace compact pill |
| Index calculation | muted formula text or compact formula chip |
| Aliasing | amber/violet marker only when present |
| Hidden solution cell | soft blank cell, no teaser text |

The table should remain trace-derived and should not introduce UI-derived logic.

## What We Should Not Borrow

Do not borrow:

- the framework-free DOM architecture,
- direct table cell editing semantics,
- pipeline stage meanings,
- PNG export for v1,
- context menus everywhere,
- desktop-only `min-width` behavior,
- a custom global CSS system that fights MUI.

The useful part is the visual/interaction language, not the internal architecture.

## CodeMirror 6 Plan

Decision: use CodeMirror 6 for source editors.

Rationale:

- It gives real editor behavior instead of large textareas.
- It supports extension-based configuration.
- It can be themed to match the reference UI.
- It can host C syntax highlighting through external language support.
- It can host a custom RISC-V language extension later if the adapted semantic highlighter is not enough.

CodeMirror facts from official docs:

- Editors are created with `EditorView`.
- Editor behavior is configured through extensions.
- `basicSetup` provides common editor behavior.
- Language packages expose language extensions.
- CodeMirror can be styled to match the app because the editor itself starts as a borderless element.

### Package Direction

Likely packages:

- `codemirror`
- `@codemirror/view`
- `@codemirror/state`
- `@codemirror/language`
- `@codemirror/commands`
- `@codemirror/search`
- `@codemirror/autocomplete`
- `@codemirror/lint`
- C/C++ language support package for C-like syntax highlighting.

Exact package names and versions should be verified at implementation time before installing.

### Editor Architecture

Create presentation-only editor components:

```text
src/presentation/components/editors/
  CodeEditor.tsx
  CSourceEditor.tsx
  RiscVSourceEditor.tsx
  ManualSequenceEditor.tsx
  codeMirrorTheme.ts
  codeMirrorExtensions.ts
```

Rules:

- CodeMirror state stays inside presentation components.
- On document changes, editors call existing store actions.
- Domain parsers/translators remain unchanged.
- No prediction logic enters editor extensions.
- Editors are controlled enough to reflect store resets/imports.
- Large editor dependencies should be split out if bundle size regresses.

### C Highlighting

Use external CodeMirror language support for C-like syntax.

Do not write a C parser/highlighter by hand.

Expected behavior:

- syntax-colored keywords,
- numbers,
- identifiers,
- comments,
- operators,
- braces/parens,
- optional diagnostics from our didactic translator shown separately, not as a compiler-grade C linter.

The editor must not imply that the app is a full C compiler.

### RISC-V Highlighting

Borrow the semantic approach from `Pipeline Table Editor`:

- classify instruction mnemonics,
- classify registers,
- classify labels,
- classify comments/annotations,
- keep the implementation small and deterministic,
- use CSS classes/tags for styling rather than mixing styling into parser logic.

Recommended implementation path:

1. Extract or reimplement a small tokenizer inspired by the editor's assembly highlighter.
2. Support RISC-V branch-focused syntax first:
   - labels,
   - addresses,
   - mnemonics,
   - registers,
   - immediates,
   - comments.
3. Use CodeMirror decoration/highlight extension or a custom language support package if the first decorator approach becomes awkward.
4. Keep RISC-V semantic highlighting independent from `RiscVParser`; the parser remains canonical for simulation input.

### Manual Sequence Highlighting

Manual sequence can also benefit from lightweight syntax highlighting:

- branch ids `B1..Bn`,
- outcomes `T` / `NT`,
- `index=`,
- `address=`,
- comments,
- repeated range syntax.

This can be a later step after C and RISC-V editors are stable.

## Theme File Plan

Create small theme files instead of one large theme file:

```text
src/presentation/theme/
  tokens.ts
  palette.ts
  typography.ts
  shape.ts
  shadows.ts
  componentOverrides/
    buttons.ts
    inputs.ts
    menus.ts
    tables.ts
    panels.ts
    scrollbars.ts
  theme.ts
```

Start with fewer files if implementation friction appears:

```text
tokens.ts
componentOverrides.ts
theme.ts
```

Do not split files merely for symmetry. Split when the theme becomes hard to review.

## Proposed Redesign Information Architecture

### Sidebar

Sections:

1. Brand/session
   - title,
   - current template,
   - current variant,
   - mode.
2. Sources
   - source tabs or source selector,
   - source status,
   - compact actions.
3. Predictor
   - active predictor summary,
   - edit JSON button/disclosure.
4. Workflow
   - step/back/run/reset,
   - calculate/check depending on mode.
5. Import/export
   - export menu,
   - YAML import disclosure.

### Workspace

Top:

- active source editor,
- source diagnostics.

Middle:

- simulation controls, step counter,
- dynamic table shell.

Bottom or side drawer:

- calculations,
- statistics,
- correction feedback,
- exported output.

## Implementation Phases

### Phase 0: Design System Foundation

Goal: create visual tokens and component overrides without changing layout.

Tasks:

- add tokenized theme files,
- add scrollbar global styles,
- align MUI buttons, inputs, menus, paper, and table cells with reference style,
- keep existing component structure,
- run visual smoke.

Exit criteria:

- app still behaves the same,
- visual language starts matching the reference,
- no new UX flows yet.

### Phase 1: Layout Reframe

Goal: move from dashboard layout to tool layout.

Tasks:

- introduce app shell with left sidebar and main workspace,
- move configuration to sidebar,
- keep simulation table in main workspace,
- keep store/application contracts unchanged,
- preserve Exam/Solution leakage behavior.

Exit criteria:

- desktop layout feels like a focused table tool,
- mobile/tablet stack safely,
- e2e flows pass.

### Phase 2: Source Editor Simplification

Goal: stop showing all source editors at once.

Tasks:

- add source tabs or source selector,
- show one source editor at a time,
- keep source sync status visible,
- preserve C -> RISC-V -> manual sequence flows.

Exit criteria:

- source editing takes less vertical space,
- no loss of current parser/translator behavior.

### Phase 3: CodeMirror 6 Integration

Goal: replace MUI textareas for source editors with CodeMirror 6.

Tasks:

- install CodeMirror 6 packages,
- create reusable `CodeEditor`,
- add C editor with external language support,
- add RISC-V editor with semantic highlighting inspired by the reference editor,
- theme CodeMirror to match app tokens,
- test reset/import/update behavior.

Exit criteria:

- C and RISC-V source editing feels like a real code editor,
- editor bundle size remains acceptable,
- build has no large unplanned chunk warning,
- e2e source flows pass.

### Phase 4: Table Visual Upgrade

Goal: make the simulation table the central visual object.

Tasks:

- table shell styling,
- sticky headers,
- compact rows,
- semantic pills for trace cells,
- polished horizontal scroll,
- hidden Exam cells styled as intentionally blank.

Exit criteria:

- trace is easier to scan,
- Exam/Solution distinction is visually clear,
- exports remain data-derived and unchanged.

### Phase 5: Workflow Surface Cleanup

Goal: reduce permanent clutter.

Tasks:

- convert export buttons to menu,
- move YAML import into disclosure/drawer,
- move calculations/exported text into result drawer/modal,
- make answer checking mode-specific and compact.

Exit criteria:

- first viewport is no longer dominated by secondary panels,
- all existing workflows remain reachable.

### Phase 6: QA And Documentation

Tasks:

- update screenshots if we start tracking them,
- run unit/e2e/lint/build/audit,
- run visual QA desktop/tablet/mobile,
- update README and release checklist evidence,
- update architecture notes if presentation structure changes.

## Risk Assessment

| Risk | Severity | Mitigation |
| --- | --- | --- |
| CodeMirror bundle growth | Medium | code-split editor or keep extensions minimal |
| MUI theme overrides becoming too broad | Medium | keep overrides token-driven and snapshot visual flows |
| UI redesign breaking Exam leakage rules | High | keep existing e2e leakage tests and add visual assertions |
| Source editor state desync | High | test import/reset/template switching carefully |
| Copying reference too literally | Medium | preserve simulator-specific workflows and React/MUI architecture |
| Overloading v1 with redesign scope | Medium | phase the work and keep each phase shippable |

## UX/GUI Subagent Recommendation

Yes, a dedicated UX/GUI specialist is worth it for this next phase.

Recommended role: `Interaction Design Guardian`.

Type: explorer first, worker only after patterns are approved.

Responsibilities:

- protect the table-centered tool workflow,
- compare every UI change against the reference style notes,
- catch visual clutter before implementation spreads,
- review sidebar/workspace hierarchy,
- review responsive states,
- review keyboard/focus behavior,
- ensure Exam/Solution rules are visually obvious,
- coordinate with the architecture/SOLID reviewer so presentation cleanup does not leak domain logic into React.

Why this should be a separate role:

- The next work is no longer mainly domain correctness.
- The risk is design entropy: many small UI changes could individually seem fine but collectively recreate the messy dashboard.
- A UX/GUI guardian can review user flow and visual hierarchy while the main engineer keeps implementation, tests, and architecture coherent.

How it should communicate with existing agents:

- With Documentation Guardian:
  - keep the redesign plan, requirements, README, and release notes aligned.
- With SOLID And Patterns Guardian:
  - ensure layout/components do not absorb prediction, projection, or persistence rules.
- With E2E QA:
  - update flows for source tabs, export menu, import drawer, and CodeMirror editors.
- With Material Visual QA:
  - check actual screenshots against the reference visual direction.

If the agent list is updated later, add this role explicitly to `docs/DECISIONES_TECNICAS_Y_AGENTES.md` and `.codex/AGENTES.md`.

## First Concrete Next Step

Do not start by installing CodeMirror.

Start with Phase 0 and Phase 1:

1. Build theme tokens and MUI overrides based on the reference.
2. Reframe the layout into sidebar + workspace while keeping existing textareas.
3. Confirm the UI already feels calmer.
4. Only then integrate CodeMirror.

This keeps the redesign reversible and prevents the editor integration from hiding more fundamental layout problems.
