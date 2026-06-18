# Branch Predictor Simulator Architecture

This document complements [REQUISITOS.md](REQUISITOS.md). It defines the technical structure, layer rules, main contracts, and design patterns for the simulator.

## 1. Architecture Goals

- Keep the simulation core independent from the UI.
- Cover the v1 requirements without coupling the engine to exercise-specific screens.
- Make future predictors such as Tournament and TAGE possible without rewriting the UI.
- Respect SOLID, especially clear responsibilities, extension through interfaces, and dependency on abstractions.

## 2. Current Layering

The codebase uses four main layers:

- `src/domain`: predictors, indexers, simulation, statistics, correction, and source parsers/translators.
- `src/application`: `SimulationSessionService`, minimal ports, and projectors.
- `src/infrastructure`: YAML, Zod schemas, official templates, predictor config validation, and table exporters.
- `src/presentation`: React/MUI components, Zustand store, screens, and theme.

Dependency rule:

```text
presentation -> application -> domain
infrastructure -> application/domain
domain -> no UI, YAML, DOM, browser storage, React, MUI, or Zustand
```

## 3. Implemented Contracts

- `BranchPredictor`: common predictor contract.
- `PredictorFactory`: creates executable predictors from typed configuration.
- `SimulationEngine`: runs branch sequences and emits canonical trace steps.
- `SequenceExpander`: expands repeated ranges into canonical executions.
- `TraceStep`: captures before/after state, prediction, actual outcome, hit/miss, index, counters, and aliasing details.
- `StatsCalculator`: calculates statistics from trace only.
- `TableProjector`: converts trace into dynamic table views.
- `CalculationViewBuilder`: derives compact calculation views from trace details.
- `AnswerChecker`: checks table and statistic answers against canonical results.
- `StatAnswerParser`: normalizes numbers, fractions, percentages, and units.
- `TableAnswerParser`: parses table answers entered as text.
- `SessionYamlMapper`: serializes only persistable input.
- `TemplateValidator`: validates official templates through schemas and the real engine.

## 4. Design Patterns

| Problem | Pattern | Concrete Use |
| --- | --- | --- |
| Selecting predictor implementation | Factory Method | `PredictorFactory.create(config)` |
| Changing indexing policy | Strategy | LSB, manual, XOR, and concatenation indexers |
| Keeping storage/export outside domain | Ports and Adapters | YAML mapper and table exporters |
| Building predictor-specific tables | Projection/Presenter | `TableProjector` |
| Validating official data | Validator | `TemplateValidator` |
| Parsing statistic answers | Interpreter/Parser | `StatAnswerParser` |
| Checking multiple answer types | Rule-based checker | `AnswerChecker` |

Patterns intentionally avoided:

- Singleton, because it makes testing harder.
- Deep inheritance between predictors, because composition better preserves predictor-specific invariants.
- Global observers in the domain, because trace output is enough for v1.

## 5. SOLID Rules

- `SimulationEngine` simulates; it does not render, export, or persist.
- `StatsCalculator` calculates; it does not check answers.
- `AnswerChecker` checks; it does not run the engine.
- `SessionYamlMapper` maps session input; it does not know prediction rules.
- `TableProjector` prepares views; it does not mutate predictor state.
- New predictors should add a config type plus an implementation rather than expanding a large conditional object.
- UI components must not implement prediction, indexing, history, saturation, or statistic rules.

## 6. Current Architectural Deviations

These are accepted for the current stage:

- The application layer is concentrated in `SimulationSessionService` instead of many small use cases. If it grows further, extract use-case classes around translation, simulation, checking, and persistence.
- The UI currently uses MUI `TextField` editors and a TanStack-powered simulation table. Monaco is deferred until it reduces editor complexity enough to justify the bundle cost.
- Exam/solution mode exists in state and projections, with e2e coverage for enriched table leakage. Keep reviewing new UI surfaces for accidental solution exposure.
- The presentation layer owns a small composition module that wires concrete infrastructure adapters into the application service. The Zustand store consumes that composition instead of instantiating adapters directly.

## 7. Architecture Watchlist

The current production import graph has no detected cycles. The following areas need strict review as the v1 surface grows:

| Area | Risk | Guardrail |
| --- | --- | --- |
| `src/presentation/stores/simulationStore.ts` | Broad store responsibilities | Keep prediction rules and adapter construction out of the store; extract reset/session helpers if more flows are added |
| `src/presentation/components/DashboardShell.tsx` | Large component mixing layout, editors, table, import, and checking UI | Split into panels and keep components free of domain calculations |
| `src/application/SimulationSessionService.ts` | Facade could collect too many use cases | Extract dedicated use-case classes if translation, checking, or persistence logic grows |
| `src/domain/source/CTranslator.ts` | Parser, analyzer, and emitter are close together | Split only when C support expands beyond the didactic branch-focused subset |
| `src/infrastructure/predictors/PredictorConfigSchema.ts` | Large schema module | Keep as the validation boundary, but avoid adding predictor behavior here |
| `src/infrastructure/templates/officialTemplates.ts` | Large verified data file | Split by exercise if richer expected tables or metadata make reviews harder |

## 8. Main Flows

### Simulation

1. UI reads session input from the Zustand store.
2. `SimulationSessionService` creates a predictor through `PredictorFactory`.
3. `SequenceExpander` produces canonical executions.
4. `SimulationEngine` emits trace steps.
5. `TableProjector` converts trace into a table view.
6. UI renders the projection.

### Checking

1. User enters table and/or statistic answers.
2. `TableAnswerParser` and `StatAnswerParser` normalize input.
3. `StatsCalculator` derives expected statistics from trace.
4. `AnswerChecker` compares user input with canonical trace/statistics.
5. UI renders the correction summary.

### YAML Export

1. UI passes editable session input to `SimulationSessionService`.
2. `SessionYamlMapper` applies source synchronization rules.
3. Derived data such as trace, table view, and statistics is excluded.
4. YAML is emitted for the user.

## 9. Current Coverage Matrix

| Requirement Area | Architectural Coverage | Implementation Status |
| --- | --- | --- |
| One-level predictor | `OneLevelPredictor` | Implemented |
| Two-level predictor | `TwoLevelPredictor` | Implemented |
| Global correlated | `GlobalCorrelatedPredictor` | Implemented |
| `gshare` | `GsharePredictor`, `XorIndexer` | Implemented |
| `gselect` | `GselectPredictor`, `ConcatenatingIndexer` | Implemented |
| Local correlated | `LocalCorrelatedPredictor` | Implemented |
| RISC-V parsing | `RiscVParser` | Initial subset implemented |
| Didactic C translation | `CTranslator` | Initial subset implemented |
| Manual sequence | `ManualBranchSequenceParser` | Implemented |
| Simulation trace | `SimulationEngine`, `TraceStep` | Implemented |
| Statistics | `StatsCalculator` | Implemented |
| Table projection | `TableProjector` | Implemented with predictor-specific trace details |
| Answer checking | `AnswerChecker` and parsers | Implemented |
| YAML | `SessionYamlMapper` | Implemented |
| Official templates | Template data and validator | Verified for v1 |
| UI | MUI/Zustand screen | Functional with validated JSON predictor configuration |
| E2E QA | Playwright | Critical flows, configuration editing, exam leakage, and responsive smoke covered |

## 10. Future Extension Points

- Tournament and TAGE should add new predictor configs and implementations behind `BranchPredictor`.
- Pipeline, ROB, return address stack, and penalties should be modeled as a future execution model rather than as changes inside each predictor.
- Image export should be another exporter implementation when it becomes a v1.1 goal.
