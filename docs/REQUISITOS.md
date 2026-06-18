# Branch Predictor Simulator Requirements

## 1. Goal

Build a local web application for studying and solving branch predictor exercises from the Computer Structure course at Universidad Complutense de Madrid.

The simulator must allow users to:

- Simulate predictors step by step or to completion.
- Fill tables similar to the official exercises.
- Check user-entered solutions.
- Load official templates based on the reference PDF.
- Work from didactic C, RISC-V, or a manual branch sequence.
- Enter manual branch sequences, including repeated ranges.
- Save and load sessions as YAML.

The first version focuses on the branch predictor exercises in the PDF. The architecture must remain ready for more advanced predictors in later versions.

## 2. V1 Scope

V1 includes:

- One-level predictors with configurable counters, especially 1-bit and 2-bit counters.
- Configurable two-level predictors `(n,m)`.
- Global correlated predictors.
- `gshare`.
- `gselect`.
- Classic local correlated predictors.
- Official templates for exercises 1, 2, 3, 4, 5, and 7.
- Dynamic simulation table.
- Step execution, full execution, reset, and loop expansion.
- Manual table/answer checking.
- Statistics calculated on demand.
- YAML import/export.
- CSV and Markdown table export.
- English-only UI and project text.

Out of scope for v1, but anticipated by the architecture:

- Tournament predictor.
- TAGE.
- Detailed pipeline simulation.
- ROB.
- Return address stack.
- Timing penalties for mispredictions.

## 3. Predictor Rules

Common conventions:

- `0 = NT`, not taken.
- `1 = T`, taken.
- Predictor states are displayed as bits.
- Saturating counters increment on `T` up to their maximum and decrement on `NT` down to zero.
- For 2-bit counters, `00` and `01` predict `NT`; `10` and `11` predict `T`.

Predictor configuration must support:

- Counter bit width.
- Initial counter state.
- Entry count.
- Indexing policy.
- Branch address or manual index.
- Global or local history when required by the predictor.

## 4. Input Sources

The application has three input paths:

- Didactic C source.
- RISC-V source.
- Manual branch sequence.

The C translator is intentionally didactic. It should cover loops, conditional branches, simple integer arithmetic, loads/stores when needed by exercises, and basic floating-point examples if they are required later. It is not a full C compiler and does not need stack management, ABI support, complex calls, or a runtime.

The simulation source of truth is the branch execution sequence. RISC-V is used to detect branches and provide addresses/labels; actual outcomes `T/NT` come from the manual sequence or official templates.

If the user edits RISC-V manually:

- C becomes locked.
- The UI marks the sources as desynchronized.
- Desynchronized C is not persisted in YAML.

The initial RISC-V parser must support `beq`, `bne`, `blt`, `bge`, `bgt`, `ble`, `beqz`, `bnez`, labels, optional hexadecimal addresses, and comments.

## 5. Manual Sequence

Manual sequence rows represent concrete branch executions.

Expected fields:

- Branch id: `B1`, `B2`, ..., `Bn`.
- Actual outcome: `T` or `NT`.
- Optional address.
- Optional manual index.
- Optional comment.

Repeated ranges are part of v1 through a textual representation and canonical expansion. A visual range editor can be added later without changing the domain model.

## 6. Simulation Table

The table is dynamic and depends on the selected predictor.

Common columns:

- Iteration.
- Branch.
- Address or index.
- History state before.
- Predictor state before.
- Prediction.
- Actual outcome.
- Hit/miss.
- Predictor state after.
- History state after.

Predictor-specific columns may include GHR, local history, second-level index, `gshare` calculation, `gselect` calculation, and aliasing information.

Tables and exports must be built from canonical trace projections, never from the DOM.

## 7. Modes

Exam mode:

- Hides solution-derived predictions, calculations, and statistics until the user asks to check or calculate.
- Lets users enter table answers and statistic answers.
- Runs correction only after an explicit action.

Solution mode:

- May reveal the canonical trace, compact calculations, official template solution notes, and expected statistics.

## 8. Statistics And Checking

Statistics are calculated from the canonical trace.

Required statistics:

- Hits.
- Misses.
- Hit rate.
- Miss rate.
- Predictor memory.
- Used entries.
- Aliasing events.
- Final GHR, counters, and local histories when applicable.

Answer checking must accept integers, equivalent fractions, percentages, units where relevant, and configurable tolerance for percentages.

## 9. Official Templates

V1 templates:

- Exercise 1: 2-bit predictor.
- Exercise 2: `(1,1)` and `(1,2)` predictors.
- Exercise 3: `(3,2)` predictor with 512 entries and 9 LSBs.
- Exercise 4: correlated `(2,2)` with B1/B2.
- Exercise 5: `gshare`.
- Exercise 7: `T-T-NT` pattern with `(2,2)`.

Exercise 6 remains out of v1 because it requires Tournament.

Templates must include statement, predictor configuration, sequence, initial state, official notes, and expected statistics. Verified templates must be validated by running the real engine.

## 10. Persistence And Export

YAML stores only user-editable input:

- Predictor configuration.
- Branch sequence.
- Loops/repetitions.
- RISC-V source.
- C source only when synchronized with RISC-V.
- Language/mode metadata.
- User-entered answers.

YAML must not store derived tables, calculated statistics, or desynchronized C.

Export formats:

- YAML session.
- CSV table.
- Markdown table.

Image export is deferred unless it becomes cheap after v1.

## 11. UI

The app is a local web application.

Desired style:

- Material-inspired.
- Clear, academic, and dense without becoming overwhelming.
- Essential controls visible.
- Advanced options in expandable or secondary panels.

Main layout:

- C editor.
- RISC-V editor.
- Manual sequence editor.
- Predictor table.
- Side panel for configuration, templates, statistics, and checking.

## 12. Architecture Requirements

The simulation core must remain independent of UI concerns.

Required separation:

- Common `BranchPredictor` contract.
- Predictor implementations per type.
- Serialization separated from domain logic.
- Official templates as versioned data.
- Trace as the source for tables, calculations, statistics, checking, and exports.

## 13. Current Implementation Status

Synchronization date: 2026-06-14.

Implemented:

- One-level, two-level `(n,m)`, global correlated, `gshare`, `gselect`, and local correlated predictors.
- Canonical simulation engine, loop expansion, partial/full execution, and trace-derived statistics.
- LSB, manual, XOR, and concatenation indexing.
- Initial RISC-V parser.
- Didactic C translator for supported loop/branch exercises.
- Editable manual branch sequence text format.
- YAML with Zod validation and derived-data exclusion.
- CSV/Markdown export.
- Statistic and table answer checking.
- Official templates for exercises 1, 2, 3, 4, 5, and 7 are engine-verified against expected official statistics.
- Functional local MUI/Zustand UI.

Incomplete:

- Full visual predictor configurator.
- Visual loop editing.
- Fine-grained active RISC-V instruction highlighting.
- Explicit UI action for stepping backward.
- Playwright e2e, visual QA, responsive QA, and basic accessibility pass.
- Richer official table projections for templates 2, 3, and 4.
