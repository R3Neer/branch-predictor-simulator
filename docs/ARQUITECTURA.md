# Diseño y arquitectura del simulador de branch predictors

Este documento complementa [REQUISITOS.md](REQUISITOS.md). Define los casos de uso principales, el modelo de dominio, la arquitectura técnica, los diagramas de clases y los patrones de diseño recomendados para implementar el simulador.

La arquitectura busca cuatro objetivos:

- Mantener el núcleo de simulación independiente de la interfaz.
- Cubrir todos los requisitos funcionales de la v1.
- Facilitar la extensión hacia Tournament, TAGE, pipeline, ROB y pila de retorno.
- Respetar SOLID, especialmente separación de responsabilidades, extensión sin modificación y dependencia de abstracciones.

## Estado actual de la arquitectura implementada

Fecha de sincronización documental: 2026-06-14.

La codebase ya sigue la división principal prevista:

- `src/domain`: predictores, indexadores, simulación, estadísticas, corrección y parsers/traductores de fuentes.
- `src/application`: `SimulationSessionService`, puertos mínimos de exportación/YAML y proyectores de tabla/cálculos.
- `src/infrastructure`: exportadores CSV/Markdown, mapper YAML, esquemas Zod de configuración y plantillas oficiales.
- `src/presentation`: UI React/MUI, store Zustand, pantalla principal y tema.

Contratos ya materializados:

- `BranchPredictor` y `PredictorFactory` para seleccionar implementaciones por configuración.
- `SimulationEngine`, `SequenceExpander` y `TraceStep` como fuente canónica de ejecución.
- `StatsCalculator` calculando desde traza.
- `TableProjector` y `CalculationViewBuilder` generando vistas derivadas.
- `AnswerChecker`, `StatAnswerParser` y `TableAnswerParser` para corrección.
- `SessionYamlMapper` para persistir solo input regenerable.
- `TemplateValidator` y esquemas de plantillas para datos oficiales.

Desviaciones conscientes respecto al diseño ideal:

- La capa de aplicación está concentrada actualmente en `SimulationSessionService` en vez de muchos casos de uso pequeños. Es aceptable para esta fase, pero conviene extraer casos de uso si el servicio sigue creciendo.
- La UI usa `TextField` para editores y tabla HTML básica; Monaco y TanStack Table están instalados y se reservan para el refinamiento funcional de v1.
- El modo examen/solución existe como estado y afecta a proyecciones, pero aún falta endurecer todos los casos visuales donde pueda filtrarse información.
- Las plantillas no están todas verificadas contra soluciones oficiales; `verificationStatus` distingue datos verificados de borradores.

La tabla de la sección 24 describe cobertura arquitectónica, no implementación completada al 100%.

## 19. Diagramas de casos de uso

Mermaid no ofrece un diagrama UML de casos de uso nativo tan completo como PlantUML. Por tanto, los siguientes diagramas usan `flowchart` con convenciones UML:

- Actores fuera de la frontera del sistema.
- Casos de uso como óvalos.
- Frontera del sistema como `subgraph`.
- Relaciones `<<include>>` y `<<extend>>` indicadas en las flechas.

### 19.1 Simulación y estudio

```mermaid
flowchart LR
    student["Actor: Estudiante"]

    subgraph system["Sistema: Simulador de branch predictors"]
        UC_LoadTemplate(["Cargar plantilla oficial"])
        UC_ConfigurePredictor(["Configurar predictor"])
        UC_EnterSequence(["Introducir secuencia de saltos"])
        UC_DefineLoops(["Definir bucles visuales"])
        UC_RunStep(["Ejecutar paso a paso"])
        UC_RunAll(["Ejecutar simulación completa"])
        UC_SkipLoop(["Saltar bucle completo"])
        UC_StepBack(["Retroceder paso"])
        UC_Reset(["Reiniciar simulación"])
        UC_ViewTrace(["Ver tabla dinámica"])
        UC_ViewLoopSummary(["Ver resumen de bucle saltado"])
        UC_HighlightAsm(["Resaltar instrucción RISC-V activa"])
    end

    student --> UC_LoadTemplate
    student --> UC_ConfigurePredictor
    student --> UC_EnterSequence
    student --> UC_DefineLoops
    student --> UC_RunStep
    student --> UC_RunAll
    student --> UC_SkipLoop
    student --> UC_StepBack
    student --> UC_Reset

    UC_LoadTemplate -. "<<include>>" .-> UC_ConfigurePredictor
    UC_LoadTemplate -. "<<include>>" .-> UC_EnterSequence
    UC_DefineLoops -. "<<extend>>" .-> UC_EnterSequence
    UC_RunStep -. "<<include>>" .-> UC_ViewTrace
    UC_RunAll -. "<<include>>" .-> UC_ViewTrace
    UC_RunStep -. "<<include>>" .-> UC_HighlightAsm
    UC_RunAll -. "<<include>>" .-> UC_HighlightAsm
    UC_SkipLoop -. "<<extend>>" .-> UC_RunStep
    UC_SkipLoop -. "<<include>>" .-> UC_ViewLoopSummary
    UC_StepBack -. "<<extend>>" .-> UC_RunStep
    UC_Reset -. "<<include>>" .-> UC_ViewTrace
```

Cobertura:

- Cubre plantilla, configuración manual, ejecución incremental, ejecución completa, reinicio, retroceso opcional y bucles.
- `Saltar bucle completo` es una acción del estudiante que aparece cuando la ejecución alcanza un `LoopRange`.
- El resumen del tramo saltado es obligatorio porque el bucle se ejecuta internamente y debe ser verificable.
- `Retroceder paso` queda modelado como extensión, alineado con el requisito de implementarlo si la complejidad es razonable.

### 19.2 Entrada C/RISC-V y secuencia real

```mermaid
flowchart LR
    student["Actor: Estudiante"]

    subgraph system["Sistema: Simulador de branch predictors"]
        UC_EditC(["Editar código C"])
        UC_TranslateC(["Generar RISC-V didáctico"])
        UC_EditAsm(["Editar RISC-V"])
        UC_LockC(["Bloquear editor C"])
        UC_WarnDesync(["Avisar desincronización"])
        UC_ConfirmResync(["Confirmar resincronización"])
        UC_Resync(["Resincronizar desde C"])
        UC_DetectBranches(["Detectar saltos RISC-V"])
        UC_BuildBranchList(["Crear lista de saltos B1..Bn"])
        UC_BuildSequenceSkeleton(["Crear tabla base de secuencia"])
        UC_FillOutcomes(["Rellenar resultados T/NT"])
        UC_EditManualSequence(["Editar secuencia manual"])
    end

    student --> UC_EditC
    student --> UC_EditAsm
    student --> UC_ConfirmResync
    student --> UC_FillOutcomes
    student --> UC_EditManualSequence

    UC_EditC -. "<<include>>" .-> UC_TranslateC
    UC_TranslateC -. "<<include>>" .-> UC_DetectBranches
    UC_EditAsm -. "<<include>>" .-> UC_LockC
    UC_EditAsm -. "<<include>>" .-> UC_WarnDesync
    UC_EditAsm -. "<<include>>" .-> UC_DetectBranches
    UC_ConfirmResync -. "<<include>>" .-> UC_Resync
    UC_Resync -. "<<include>>" .-> UC_TranslateC
    UC_DetectBranches -. "<<include>>" .-> UC_BuildBranchList
    UC_BuildBranchList -. "<<include>>" .-> UC_BuildSequenceSkeleton
    UC_BuildSequenceSkeleton -. "<<extend>>" .-> UC_FillOutcomes
    UC_EditManualSequence -. "<<include>>" .-> UC_FillOutcomes
```

Cobertura:

- El C ayuda a generar RISC-V, pero no es fuente de verdad de la simulación.
- El RISC-V es fuente de verdad para detectar instrucciones de salto.
- La secuencia real `T/NT` es fuente de verdad del comportamiento observado.
- Si el usuario edita RISC-V, el C queda bloqueado y no se guarda si queda desincronizado.
- La tabla manual permite trabajar sin C ni RISC-V completo.

### 19.3 Modos, corrección, estadísticas y cálculos

```mermaid
flowchart LR
    student["Actor: Estudiante"]

    subgraph system["Sistema: Simulador de branch predictors"]
        UC_SelectExamMode(["Seleccionar modo examen"])
        UC_SelectSolutionMode(["Seleccionar modo solución"])
        UC_EditTableAnswer(["Introducir solución en tabla"])
        UC_EditStatsAnswer(["Introducir estadísticas esperadas"])
        UC_Check(["Comprobar solución"])
        UC_CalculateStats(["Calcular estadísticas bajo demanda"])
        UC_ShowCorrection(["Mostrar corrección"])
        UC_FillOfficialTable(["Rellenar tabla con solución"])
        UC_ViewOfficialSolution(["Ver solución oficial"])
        UC_ShowCompactCalc(["Mostrar cálculos compactos"])
        UC_ExpandCalc(["Expandir traza de cálculo"])
        UC_ShowMoreStats(["Mostrar más estadísticas"])
        UC_ParseStatsAnswer(["Interpretar enteros, fracciones, porcentajes y unidades"])
    end

    student --> UC_SelectExamMode
    student --> UC_SelectSolutionMode
    student --> UC_EditTableAnswer
    student --> UC_EditStatsAnswer
    student --> UC_Check
    student --> UC_CalculateStats
    student --> UC_FillOfficialTable
    student --> UC_ViewOfficialSolution
    student --> UC_ShowCompactCalc
    student --> UC_ShowMoreStats

    UC_SelectExamMode -. "<<include>>" .-> UC_EditTableAnswer
    UC_SelectExamMode -. "<<include>>" .-> UC_EditStatsAnswer
    UC_Check -. "<<include>>" .-> UC_ParseStatsAnswer
    UC_Check -. "<<include>>" .-> UC_CalculateStats
    UC_Check -. "<<include>>" .-> UC_ShowCorrection
    UC_CalculateStats -. "<<extend>>" .-> UC_ShowCorrection
    UC_SelectSolutionMode -. "<<include>>" .-> UC_FillOfficialTable
    UC_SelectSolutionMode -. "<<include>>" .-> UC_ViewOfficialSolution
    UC_ShowCompactCalc -. "<<extend>>" .-> UC_ViewOfficialSolution
    UC_ExpandCalc -. "<<extend>>" .-> UC_ShowCompactCalc
    UC_ShowMoreStats -. "<<extend>>" .-> UC_CalculateStats
```

Cobertura:

- El modo examen oculta soluciones, estadísticas y cálculos hasta que se pulsa comprobar.
- El modo solución se modela como modo propio, no como efecto secundario de plantillas.
- La corrección cubre bits, predicciones, aciertos/fallos y estadísticas.
- La interpretación de respuestas estadísticas queda separada para aceptar enteros, fracciones, porcentajes, unidades y margen configurable.

### 19.4 Persistencia, exportación e idioma

```mermaid
flowchart LR
    student["Actor: Estudiante"]
    browserStorage["Actor secundario: LocalStorage"]
    fileSystem["Actor secundario: Sistema de archivos"]

    subgraph system["Sistema: Simulador de branch predictors"]
        UC_ExportYaml(["Exportar sesión YAML"])
        UC_ImportYaml(["Importar sesión YAML"])
        UC_FilterDerivedData(["Excluir datos calculables"])
        UC_FilterDesyncedC(["Excluir C desincronizado"])
        UC_AutoPersist(["Guardar borrador automático"])
        UC_RestoreDraft(["Restaurar borrador automático"])
        UC_ExportCsv(["Exportar tabla CSV"])
        UC_ExportMarkdown(["Exportar tabla Markdown"])
        UC_ExportImage(["Exportar imagen de tabla o vista"])
        UC_ChangeLanguage(["Cambiar idioma ES/EN"])
    end

    student --> UC_ExportYaml
    student --> UC_ImportYaml
    student --> UC_ExportCsv
    student --> UC_ExportMarkdown
    student --> UC_ExportImage
    student --> UC_ChangeLanguage

    UC_ExportYaml -. "<<include>>" .-> UC_FilterDerivedData
    UC_ExportYaml -. "<<include>>" .-> UC_FilterDesyncedC
    UC_AutoPersist --> browserStorage
    UC_RestoreDraft --> browserStorage
    UC_ExportYaml --> fileSystem
    UC_ImportYaml --> fileSystem
    UC_ExportCsv --> fileSystem
    UC_ExportMarkdown --> fileSystem
    UC_ExportImage --> fileSystem
    UC_RestoreDraft -. "<<extend>>" .-> UC_AutoPersist
```

Cobertura:

- YAML guarda input de usuario, no tablas ni estadísticas regenerables.
- El C desincronizado se excluye explícitamente.
- LocalStorage es persistencia auxiliar, no sustituto de importar/exportar YAML.
- La exportación a imagen queda como capacidad opcional razonable de v1/v1.1.

### 19.5 Gestión de plantillas oficiales

```mermaid
flowchart LR
    student["Actor: Estudiante"]
    maintainer["Actor: Mantenedor de plantillas"]

    subgraph system["Sistema: Simulador de branch predictors"]
        UC_BrowseTemplates(["Explorar plantillas oficiales"])
        UC_ViewStatement(["Ver enunciado"])
        UC_StartFromTemplate(["Crear sesión desde plantilla"])
        UC_ViewOfficialSolution(["Ver solución oficial"])
        UC_ViewExpectedStats(["Ver estadísticas esperadas en modo solución"])
        UC_AddTemplate(["Añadir plantilla oficial"])
        UC_ValidateTemplate(["Validar plantilla"])
        UC_RunTemplateTrace(["Generar traza canónica de plantilla"])
    end

    student --> UC_BrowseTemplates
    student --> UC_ViewStatement
    student --> UC_StartFromTemplate
    student --> UC_ViewOfficialSolution
    student --> UC_ViewExpectedStats
    maintainer --> UC_AddTemplate

    UC_BrowseTemplates -. "<<include>>" .-> UC_ViewStatement
    UC_StartFromTemplate -. "<<include>>" .-> UC_ViewStatement
    UC_StartFromTemplate -. "<<include>>" .-> UC_RunTemplateTrace
    UC_ViewOfficialSolution -. "<<extend>>" .-> UC_StartFromTemplate
    UC_ViewExpectedStats -. "<<extend>>" .-> UC_ViewOfficialSolution
    UC_AddTemplate -. "<<include>>" .-> UC_ValidateTemplate
    UC_ValidateTemplate -. "<<include>>" .-> UC_RunTemplateTrace
```

Cobertura:

- Las plantillas oficiales incluyen enunciado, configuración, secuencia, estado inicial, solución oficial y estadísticas esperadas.
- La validación ejecuta el mismo motor que las sesiones manuales para evitar soluciones oficiales incoherentes.
- Tournament y TAGE quedan previstos como plantillas futuras no seleccionables en v1.

## 20. Modelo de dominio

El modelo separa entidades de dominio, configuración de predictores, trazas, respuestas de usuario y persistencia. La UI consume casos de uso y proyecciones; no manipula contadores, historiales ni reglas de indexado directamente.

### 20.1 Sesión, fuentes, secuencia y plantillas

```mermaid
classDiagram
    direction LR

    class StudySession {
        +id: SessionId
        +title: string
        +language: Language
        +mode: SessionMode
        +createdAt: Instant
        +updatedAt: Instant
    }

    class SourceBundle {
        +cSource: string
        +riscVSource: string
        +syncState: SourceSyncState
        +isCSourcePersistable() boolean
    }

    class RiscVProgram {
        +instructions: Instruction[]
        +branches: Branch[]
    }

    class RiscVSubsetSpec {
        +supportedConditionalBranches: string[]
        +supportedPseudoInstructions: string[]
        +supportedArithmeticOps: string[]
        +supportsBasicFloats: boolean
    }

    class Instruction {
        +address: Address
        +label: string
        +opcode: string
        +operands: string[]
        +rawText: string
    }

    class Branch {
        +id: BranchId
        +address: Address
        +opcode: string
        +targetLabel: string
        +manualIndex: string
    }

    class BranchSequence {
        +executions: BranchExecution[]
        +loops: LoopRange[]
    }

    class BranchExecution {
        +order: number
        +branchId: BranchId
        +actual: Outcome
        +comment: string
    }

    class LoopRange {
        +startOrder: number
        +endOrder: number
        +repetitions: number
    }

    class UserSolution {
        +tableAnswers: TableAnswer[]
        +statAnswers: StatAnswer[]
    }

    class OfficialTemplate {
        +id: TemplateId
        +exerciseNumber: number
        +title: string
        +statement: string
        +version: string
        +predictorConfig: PredictorConfig
        +initialState: PredictorState
        +branchSequence: BranchSequence
        +officialSolution: OfficialSolution
        +expectedStatistics: ExpectedStatistics
    }

    StudySession "1" o-- "1" SourceBundle
    StudySession "1" o-- "1" PredictorConfig
    StudySession "1" o-- "1" BranchSequence
    StudySession "1" o-- "0..1" UserSolution
    StudySession "1" o-- "0..1" OfficialTemplate
    SourceBundle "1" --> "0..1" RiscVProgram
    RiscVProgram "1" --> "1" RiscVSubsetSpec
    RiscVProgram "1" o-- "*" Instruction
    RiscVProgram "1" o-- "*" Branch
    BranchSequence "1" o-- "*" BranchExecution
    BranchSequence "1" o-- "*" LoopRange
    BranchExecution "*" --> "1" Branch
```

Notas de diseño:

- `SourceBundle.isCSourcePersistable()` encapsula la regla de no guardar C desincronizado.
- `OfficialTemplate` contiene todos los datos obligatorios de una plantilla, no solo metadatos.
- `SourceBundle --> RiscVProgram` es `0..1` porque una sesión manual puede existir sin código RISC-V completo.
- `RiscVSubsetSpec` documenta el subconjunto didáctico aceptado por el parser/traductor inicial.

### 20.2 Configuración de predictores

```mermaid
classDiagram
    direction TB

    class PredictorConfig {
        <<abstract>>
        +type: PredictorType
        +counterBits: number
        +initialCounters: CounterInitialisation
        +indexPolicy: IndexPolicyConfig
    }

    class OneLevelConfig {
        +entries: number
    }

    class TwoLevelConfig {
        +historyBits: number
        +firstLevelEntries: number
        +countersPerEntry: number
        +initialGhr: bitstring
        +updatePolicy: HistoryUpdatePolicy
    }

    class GlobalCorrelatedConfig {
        +ghrBits: number
        +phtEntries: number
        +initialGhr: bitstring
        +updatePolicy: HistoryUpdatePolicy
    }

    class GshareConfig {
        +pcBits: number
        +ghrBitsUsed: number
        +phtEntries: number
    }

    class GselectConfig {
        +pcBits: number
        +ghrBitsUsed: number
        +phtEntries: number
    }

    class LocalCorrelatedConfig {
        +localHistoryBits: number
        +localHistoryTableEntries: number
        +localPredictionTableEntries: number
        +initialLocalHistories: bitstring
    }

    class FutureTournamentConfig {
        <<future>>
        +selectorCounterBits: number
    }

    class FutureTageConfig {
        <<future>>
        +taggedTables: number
    }

    class PredictorPresetCatalog {
        +list(type) PredictorPreset[]
        +get(id) PredictorPreset
    }

    class PredictorPreset {
        +id: string
        +name: string
        +config: PredictorConfig
        +description: string
    }

    PredictorConfig <|-- OneLevelConfig
    PredictorConfig <|-- TwoLevelConfig
    PredictorConfig <|-- GlobalCorrelatedConfig
    GlobalCorrelatedConfig <|-- GshareConfig
    GlobalCorrelatedConfig <|-- GselectConfig
    PredictorConfig <|-- LocalCorrelatedConfig
    PredictorConfig <|-- FutureTournamentConfig
    PredictorConfig <|-- FutureTageConfig
    PredictorPresetCatalog "1" o-- "*" PredictorPreset
    PredictorPreset "*" --> "1" PredictorConfig
```

Notas de diseño:

- La configuración se especializa por predictor para evitar un objeto genérico lleno de campos ambiguos.
- `GshareConfig` y `GselectConfig` hacen explícitos los bits de PC e historia usados.
- `LocalCorrelatedConfig` separa tabla de historia local y tabla de predicción local.
- `PredictorPresetCatalog` da un lugar explícito a los presets razonables y a los presets exactos de ejercicios.
- Esta estructura respeta OCP: añadir un predictor implica añadir una configuración y una implementación, no modificar un gran `switch` de campos opcionales.

### 20.3 Trazas, estadísticas y corrección

```mermaid
classDiagram
    direction LR

    class SimulationRun {
        +status: RunStatus
        +currentStep: number
        +startedAt: Instant
    }

    class TraceStep {
        +step: number
        +branchExecution: BranchExecution
        +prediction: Outcome
        +actual: Outcome
        +hit: boolean
        +stateBefore: PredictorStateSnapshot
        +stateAfter: PredictorStateSnapshot
        +predictionTrace: PredictionTrace
        +updateTrace: UpdateTrace
    }

    class PredictorStateSnapshot {
        +ghr: bitstring
        +localHistory: bitstring
        +counterBits: bitstring
        +index: string
        +aliasGroup: string
    }

    class PredictionTrace {
        +indexCalculation: IndexCalculation
        +counterBefore: bitstring
        +selectedEntry: string
        +selectedHistory: bitstring
        +compactExplanation: string
        +detailRows: TraceDetailRow[]
    }

    class IndexCalculation {
        +policy: IndexPolicyType
        +pcBits: bitstring
        +historyBits: bitstring
        +operation: string
        +resultIndex: string
    }

    class TraceDetailRow {
        +label: string
        +valueBefore: string
        +operation: string
        +valueAfter: string
    }

    class UpdateTrace {
        +counterAfter: bitstring
        +historyAfter: bitstring
        +saturationApplied: boolean
        +aliasingEvent: AliasingEvent
    }

    class AliasingEvent {
        +entry: string
        +branchIds: BranchId[]
        +isHelpful: boolean
        +description: string
    }

    class StatisticsSet {
        +hits: number
        +misses: number
        +hitRate: Ratio
        +missRate: Ratio
        +memoryBits: number
        +usedEntries: number
        +usedPredictors: number
        +aliasingEvents: number
        +finalGhr: bitstring
        +finalCounters: CounterSnapshot[]
        +finalLocalHistories: LocalHistorySnapshot[]
    }

    class CorrectionReport {
        +tableResults: CellCorrection[]
        +statResults: StatCorrection[]
        +summary: CorrectionSummary
    }

    class OfficialSolution {
        +trace: TraceStep[]
        +statistics: StatisticsSet
        +notes: string
    }

    class ExpectedStatistics {
        +normal: StatisticsSet
        +advanced: StatisticsSet
        +tolerance: TolerancePolicy
    }

    SimulationRun "1" o-- "*" TraceStep
    TraceStep "1" --> "1" BranchExecution
    TraceStep "1" o-- "1" PredictorStateSnapshot
    TraceStep "1" o-- "1" PredictionTrace
    TraceStep "1" o-- "1" UpdateTrace
    PredictionTrace "1" o-- "1" IndexCalculation
    PredictionTrace "1" o-- "*" TraceDetailRow
    UpdateTrace "1" --> "0..1" AliasingEvent
    SimulationRun "1" --> "0..1" StatisticsSet
    CorrectionReport "*" --> "*" TraceStep
    CorrectionReport "*" --> "0..1" StatisticsSet
```

Notas de diseño:

- La traza contiene información suficiente para tablas, cálculos compactos, cálculos expandibles, comprobación y exportación.
- `IndexCalculation` permite explicar LSB, alineamiento, manual, XOR de `gshare` y concatenación de `gselect`.
- `UpdateTrace` captura saturación y aliasing sin mezclarlo con la UI.
- Las estadísticas finales incluyen todos los campos pedidos en el desplegable avanzado.

### 20.4 Predictores, indexado y estado

```mermaid
classDiagram
    direction TB

    class BranchPredictor {
        <<interface>>
        +initialise(config) PredictorState
        +predict(execution, state) PredictionResult
        +update(execution, actualOutcome, state) UpdateResult
    }

    class MemoryMeasurable {
        <<interface>>
        +memoryUsage(config) MemoryUsage
    }

    class PredictorFactory {
        +register(type, provider) void
        +create(config) BranchPredictor
    }

    class OneLevelPredictor
    class TwoLevelPredictor
    class GlobalCorrelatedPredictor
    class GsharePredictor
    class GselectPredictor
    class LocalCorrelatedPredictor
    class TournamentPredictor {
        <<future>>
    }
    class TagePredictor {
        <<future>>
    }

    class Indexer {
        <<interface>>
        +resolveIndex(branch, history, config) IndexResult
    }

    class LsbIndexer
    class AlignedAddressIndexer
    class ManualIndexer
    class XorIndexer
    class ConcatenatingIndexer

    class SaturatingCounter {
        +bits: number
        +value: number
        +predict() Outcome
        +update(actual) SaturatingCounter
    }

    class HistoryRegister {
        +bits: number
        +value: bitstring
        +shiftIn(actual) HistoryRegister
    }

    BranchPredictor <|.. OneLevelPredictor
    BranchPredictor <|.. TwoLevelPredictor
    BranchPredictor <|.. GlobalCorrelatedPredictor
    BranchPredictor <|.. GsharePredictor
    BranchPredictor <|.. GselectPredictor
    BranchPredictor <|.. LocalCorrelatedPredictor
    BranchPredictor <|.. TournamentPredictor
    BranchPredictor <|.. TagePredictor

    MemoryMeasurable <|.. OneLevelPredictor
    MemoryMeasurable <|.. TwoLevelPredictor
    MemoryMeasurable <|.. GlobalCorrelatedPredictor
    MemoryMeasurable <|.. GsharePredictor
    MemoryMeasurable <|.. GselectPredictor
    MemoryMeasurable <|.. LocalCorrelatedPredictor

    Indexer <|.. LsbIndexer
    Indexer <|.. AlignedAddressIndexer
    Indexer <|.. ManualIndexer
    Indexer <|.. XorIndexer
    Indexer <|.. ConcatenatingIndexer

    PredictorFactory --> BranchPredictor
    OneLevelPredictor --> Indexer
    TwoLevelPredictor --> Indexer
    GlobalCorrelatedPredictor --> Indexer
    GsharePredictor --> XorIndexer
    GselectPredictor --> ConcatenatingIndexer
    OneLevelPredictor --> SaturatingCounter
    TwoLevelPredictor --> SaturatingCounter
    GlobalCorrelatedPredictor --> HistoryRegister
    LocalCorrelatedPredictor --> HistoryRegister
```

Notas de diseño:

- Se evita una herencia profunda entre predictores para proteger LSP. Los predictores comparten conceptos por composición.
- `MemoryMeasurable` se separa de `BranchPredictor` para mantener ISP: simular y medir memoria son responsabilidades relacionadas, pero no idénticas.
- `PredictorFactory` centraliza la creación a partir de `PredictorConfig` y puede funcionar como registro para no abrir un gran `switch` cada vez que se añada un predictor.
- `SaturatingCounter` y `HistoryRegister` encapsulan reglas comunes y reducen duplicación.

### 20.5 Servicios de dominio, proyecciones y corrección

```mermaid
classDiagram
    direction LR

    class SimulationEngine {
        +advanceOne(session, predictor) TraceStep
        +runToCompletion(session, predictor) SimulationRun
        +runRange(session, executions, predictor) TraceStep[]
    }

    class SequenceExpander {
        +expand(sequence) BranchExecution[]
        +expand(loopRange) BranchExecution[]
    }

    class StatsCalculator {
        +calculate(trace) StatisticsSet
        +summarizeRange(trace) LoopSummary
    }

    class LoopSummary {
        +stepsExecuted: number
        +hits: number
        +misses: number
        +stateBefore: PredictorStateSnapshot
        +stateAfter: PredictorStateSnapshot
    }

    class AnswerChecker {
        +compare(solution, trace, stats) CorrectionReport
    }

    class CorrectionRule {
        <<interface>>
        +check(context) RuleResult
    }

    class BitStateRule
    class PredictionRule
    class HitMissRule
    class StatisticRule

    class StatAnswerParser {
        +parse(raw, expectedUnit) NormalizedStatAnswer
    }

    class TolerancePolicy {
        +percentageMargin: number
        +acceptEquivalentFractions: boolean
        +acceptUnits: boolean
    }

    class TableProjector {
        +project(trace, mode, language) DynamicTableView
    }

    class DynamicTableView {
        +columns: TableColumn[]
        +rows: TableRow[]
        +subtables: DynamicTableView[]
        +hiddenUntilRequested: boolean
    }

    class CalculationViewBuilder {
        +compact(traceStep) CalculationView
        +expanded(traceStep) CalculationView
    }

    class CalculationView {
        +summary: string
        +sections: CalculationSection[]
        +expandedByDefault: boolean
    }

    class TemplateValidator {
        +validate(template) ValidationReport
    }

    class SourceSyncPolicy {
        +markDesynced(sourceBundle) SourceBundle
        +canEditC(sourceBundle) boolean
        +removeNonPersistableC(sourceBundle) SourceBundle
    }

    class SessionYamlMapper {
        +toYamlDto(session) SessionYamlDto
        +fromYamlDto(dto) StudySession
    }

    SimulationEngine --> SequenceExpander
    SimulationEngine --> BranchPredictor
    StatsCalculator --> TraceStep
    StatsCalculator --> LoopSummary
    AnswerChecker --> CorrectionRule
    CorrectionRule <|.. BitStateRule
    CorrectionRule <|.. PredictionRule
    CorrectionRule <|.. HitMissRule
    CorrectionRule <|.. StatisticRule
    StatisticRule --> StatAnswerParser
    StatisticRule --> TolerancePolicy
    TableProjector --> TraceStep
    TableProjector --> DynamicTableView
    CalculationViewBuilder --> PredictionTrace
    CalculationViewBuilder --> UpdateTrace
    CalculationViewBuilder --> CalculationView
    TemplateValidator --> SimulationEngine
    TemplateValidator --> StatsCalculator
    SourceSyncPolicy --> SourceBundle
    SessionYamlMapper --> StudySession
```

Notas de diseño:

- `AnswerChecker` usa reglas pequeñas para no convertirse en una clase enorme.
- `TableProjector` y `CalculationViewBuilder` son de aplicación/presentación, pero consumen trazas de dominio sin mutarlas.
- `StatAnswerParser` evita que la comparación de porcentajes, fracciones y unidades se disperse por la UI.
- `TemplateValidator` valida estructura y coherencia ejecutando la traza canónica.

### 20.6 Extensiones futuras previstas

```mermaid
classDiagram
    direction TB

    class ExecutionModel {
        <<interface>>
        +run(program, sequence, predictor) ExecutionTrace
    }

    class BranchOnlyExecutionModel {
        +run(program, sequence, predictor) ExecutionTrace
    }

    class PipelineExecutionModel {
        <<future>>
        +stages: PipelineStage[]
        +penaltyPolicy: MispredictionPenaltyPolicy
    }

    class ReorderBuffer {
        <<future>>
        +entries: RobEntry[]
    }

    class ReturnAddressStack {
        <<future>>
        +depth: number
    }

    class MispredictionPenaltyPolicy {
        <<future>>
        +cyclesOnMiss: number
    }

    ExecutionModel <|.. BranchOnlyExecutionModel
    ExecutionModel <|.. PipelineExecutionModel
    PipelineExecutionModel --> ReorderBuffer
    PipelineExecutionModel --> ReturnAddressStack
    PipelineExecutionModel --> MispredictionPenaltyPolicy
```

Notas de diseño:

- La v1 usa `BranchOnlyExecutionModel`: secuencia real de saltos y estado del predictor.
- Pipeline, ROB, pila de retorno y penalizaciones se modelan como extensión del modelo de ejecución, no como cambios en cada predictor.
- La UI principal puede seguir consumiendo trazas y proyecciones aunque el motor futuro produzca más detalle.

## 21. Arquitectura técnica

La arquitectura usa capas con puertos y adaptadores. Las dependencias apuntan hacia el dominio y hacia abstracciones, no hacia detalles concretos.

```mermaid
classDiagram
    direction LR

    class PresentationLayer {
        +Editors
        +PredictorConfigurator
        +SequenceTable
        +SimulationTable
        +StatsPanel
        +TemplateBrowser
        +ModeSwitcher
    }

    class ApplicationLayer {
        +LoadTemplateUseCase
        +ConfigurePredictorUseCase
        +SelectModeUseCase
        +ParseRiscVUseCase
        +TranslateCUseCase
        +EditSourceUseCase
        +RunSimulationUseCase
        +StepSimulationUseCase
        +StepBackUseCase
        +SkipLoopUseCase
        +ResetSimulationUseCase
        +CheckSolutionUseCase
        +CalculateStatsUseCase
        +ImportYamlUseCase
        +ExportYamlUseCase
        +ExportTableUseCase
        +SaveDraftUseCase
        +RestoreDraftUseCase
        +ChangeLanguageUseCase
    }

    class DomainLayer {
        +BranchPredictor
        +SimulationEngine
        +SequenceExpander
        +StatsCalculator
        +AnswerChecker
        +TemplateValidator
        +SourceSyncPolicy
    }

    class SessionRepository {
        <<port>>
        +importYaml(document) StudySession
        +exportYaml(session) string
    }

    class TemplateRepository {
        <<port>>
        +list() OfficialTemplate[]
        +get(id) OfficialTemplate
    }

    class DraftRepository {
        <<port>>
        +save(session) void
        +restore() StudySession
        +clear() void
    }

    class Exporter {
        <<port>>
        +supports(format) boolean
        +export(tableView) ExportedArtifact
    }

    class I18nCatalogPort {
        <<port>>
        +translate(key, language) string
    }

    class Clock {
        <<port>>
        +now() Instant
    }

    class InfrastructureLayer {
        +YamlSessionRepository
        +LocalStorageDraftRepository
        +OfficialTemplateRepository
        +CsvExporter
        +MarkdownExporter
        +ImageExporter
        +I18nCatalogAdapter
        +SystemClock
    }

    PresentationLayer --> ApplicationLayer
    ApplicationLayer --> DomainLayer
    ApplicationLayer --> SessionRepository
    ApplicationLayer --> TemplateRepository
    ApplicationLayer --> DraftRepository
    ApplicationLayer --> Exporter
    ApplicationLayer --> I18nCatalogPort
    ApplicationLayer --> Clock
    InfrastructureLayer ..|> SessionRepository
    InfrastructureLayer ..|> TemplateRepository
    InfrastructureLayer ..|> DraftRepository
    InfrastructureLayer ..|> Exporter
    InfrastructureLayer ..|> I18nCatalogPort
    InfrastructureLayer ..|> Clock
    InfrastructureLayer --> DomainLayer
```

Reglas de dependencia:

- El dominio no depende de React, Material UI, editores, almacenamiento ni formato YAML.
- La UI no implementa lógica de predicción; solo llama a casos de uso.
- La aplicación depende de puertos, no de repositorios concretos.
- La infraestructura implementa puertos y traduce entre formatos externos y objetos del dominio.
- Las plantillas oficiales se validan con el mismo motor que simula sesiones manuales.
- El YAML persiste input de usuario, no resultados derivables.
- Las estadísticas se calculan desde la traza, no desde la tabla renderizada.
- La corrección compara contra la traza canónica generada por el motor.
- Los bucles visuales se expanden mediante `SequenceExpander`, manteniendo una secuencia canónica para simular.
- La exportación de tablas se hace desde proyecciones de la traza, no desde el DOM.

### 21.1 Flujo de simulación paso a paso

```mermaid
sequenceDiagram
    actor Student as Estudiante
    participant UI as UI
    participant UseCase as StepSimulationUseCase
    participant Engine as SimulationEngine
    participant Factory as PredictorFactory
    participant Predictor as BranchPredictor
    participant Projector as TableProjector

    Student->>UI: Ejecutar siguiente paso
    UI->>UseCase: step(sessionId)
    UseCase->>Factory: create(session.predictorConfig)
    Factory-->>UseCase: predictor
    UseCase->>Engine: advanceOne(session, predictor)
    Engine->>Predictor: predict(branchExecution, state)
    Predictor-->>Engine: prediction + predictionTrace
    Engine->>Predictor: update(branchExecution, actual, state)
    Predictor-->>Engine: newState + updateTrace
    Engine-->>UseCase: TraceStep
    UseCase->>Projector: project(trace, session.mode, language)
    Projector-->>UseCase: DynamicTableView
    UseCase-->>UI: step result + highlighted branch + table view
    UI-->>Student: Tabla actualizada y RISC-V resaltado
```

### 21.2 Flujo de salto de bucle

```mermaid
sequenceDiagram
    actor Student as Estudiante
    participant UI as UI
    participant UseCase as SkipLoopUseCase
    participant Expander as SequenceExpander
    participant Engine as SimulationEngine
    participant Stats as StatsCalculator

    Student->>UI: Saltar bucle completo
    UI->>UseCase: skipLoop(sessionId, loopRangeId)
    UseCase->>Expander: expand(loopRange)
    Expander-->>UseCase: canonical executions
    UseCase->>Engine: runRange(session, canonical executions)
    Engine-->>UseCase: TraceStep[]
    UseCase->>Stats: summarizeRange(trace)
    Stats-->>UseCase: LoopSummary
    UseCase-->>UI: final predictor state + loop summary
    UI-->>Student: Estado actualizado y resumen del tramo
```

### 21.3 Flujo de comprobación

```mermaid
sequenceDiagram
    actor Student as Estudiante
    participant UI as UI
    participant UseCase as CheckSolutionUseCase
    participant Engine as SimulationEngine
    participant Stats as StatsCalculator
    participant Parser as StatAnswerParser
    participant Checker as AnswerChecker

    Student->>UI: Pulsar comprobar
    UI->>UseCase: check(session, userSolution)
    UseCase->>Engine: runToCompletion(session)
    Engine-->>UseCase: full trace
    UseCase->>Stats: calculate(full trace)
    Stats-->>UseCase: expected statistics
    UseCase->>Parser: parse(user stat answers)
    Parser-->>UseCase: normalized answers
    UseCase->>Checker: compare(userSolution, trace, statistics)
    Checker-->>UseCase: correction report
    UseCase-->>UI: correction report
    UI-->>Student: Mostrar errores, aciertos y resultados permitidos
```

### 21.4 Flujo de exportación YAML

```mermaid
sequenceDiagram
    actor Student as Estudiante
    participant UI as UI
    participant UseCase as ExportYamlUseCase
    participant Policy as SourceSyncPolicy
    participant Mapper as SessionYamlMapper
    participant Repo as SessionRepository

    Student->>UI: Exportar YAML
    UI->>UseCase: export(sessionId)
    UseCase->>Policy: removeNonPersistableC(sourceBundle)
    Policy-->>UseCase: persistable source bundle
    UseCase->>Mapper: toYamlDto(session without derived data)
    Mapper-->>UseCase: yaml document
    UseCase->>Repo: saveExport(yaml document)
    Repo-->>UseCase: exported file handle
    UseCase-->>UI: YAML listo
```

## 22. Patrones de diseño aplicables

| Problema | Patrón recomendado | Aplicación concreta |
| --- | --- | --- |
| Seleccionar predictor según configuración | Factory Method / Abstract Factory | `PredictorFactory.create(config)` devuelve la implementación adecuada. |
| Cambiar política de indexado | Strategy | `Indexer` con `LsbIndexer`, `AlignedAddressIndexer`, `ManualIndexer`, `XorIndexer`, `ConcatenatingIndexer`. |
| Separar dominio de almacenamiento/exportación | Ports and Adapters | `SessionRepository`, `TemplateRepository`, `Exporter`, `I18nCatalogPort`. |
| Construir tablas diferentes por predictor | Projection / Presenter | `TableProjector` convierte `TraceStep[]` en vistas dinámicas sin tocar el motor. |
| Validar plantillas oficiales | Validator | `TemplateValidator` ejecuta reglas estructurales y traza canónica. |
| Interpretar respuestas de estadísticas | Interpreter / Parser | `StatAnswerParser` normaliza enteros, fracciones, porcentajes y unidades. |
| Representar modos examen/solución | State ligera | `SessionMode` condiciona proyecciones, visibilidad y acciones permitidas. |
| Añadir exportadores CSV/Markdown/imagen | Strategy | `Exporter` con implementaciones por formato. |
| Encadenar reglas de corrección | Chain of Responsibility | Reglas para bits, predicción, hit/miss, estadísticas y tolerancias. |
| Generar cálculos compactos y expandibles | Builder | `CalculationViewBuilder` crea explicación compacta y detalle desde la traza. |

Patrones descartados o no prioritarios:

- Singleton: no aporta valor claro y dificulta pruebas.
- Observer global: puede ser útil en UI, pero no debe filtrarse al dominio.
- Visitor: solo tendría sentido si crece mucho la exportación o renderizado por tipos de traza.
- Command: útil si se implementa retroceso robusto; en v1 puede bastar con snapshots o historial de `TraceStep`.

## 23. Revisión SOLID

### 23.1 Single Responsibility Principle

- `SimulationEngine` simula; no renderiza ni exporta.
- `StatsCalculator` calcula estadísticas; no corrige respuestas.
- `AnswerChecker` corrige; no recalcula el motor.
- `SessionYamlMapper` serializa DTOs; no decide reglas de predicción.
- `TableProjector` prepara vistas; no modifica estado del predictor.

### 23.2 Open/Closed Principle

- Nuevos predictores se añaden implementando `BranchPredictor` y una configuración específica.
- Nuevas políticas de indexado se añaden implementando `Indexer`.
- Nuevos formatos de exportación se añaden implementando `Exporter`.
- Nuevas reglas de corrección se añaden como reglas independientes.

### 23.3 Liskov Substitution Principle

- Se evita una herencia profunda entre predictores porque `gshare`, `gselect`, local y multinivel comparten conceptos, pero no siempre las mismas invariantes.
- La sustitución se apoya en interfaces pequeñas y composición.
- `BranchPredictor` debe garantizar que `predict` no muta estado y `update` devuelve un nuevo estado o una mutación controlada y trazable.

### 23.4 Interface Segregation Principle

- `BranchPredictor` no obliga a implementar exportación, renderizado ni persistencia.
- `MemoryMeasurable` se separa para no hinchar el contrato de simulación.
- Los puertos de infraestructura se separan por responsabilidad: sesión, plantillas, borrador, exportación e i18n.

### 23.5 Dependency Inversion Principle

- La capa de aplicación depende de puertos, no de `YamlSessionRepository` ni `LocalStorageDraftRepository`.
- El dominio no conoce frameworks ni detalles de almacenamiento.
- La infraestructura implementa adaptadores concretos hacia YAML, LocalStorage, CSV, Markdown e imagen.

## 24. Revisión de consistencia entre requisitos y arquitectura

| Requisito/caso de uso | Elementos de arquitectura que lo cubren | Estado |
| --- | --- | --- |
| Cargar plantillas oficiales | `OfficialTemplateRepository`, `LoadTemplateUseCase`, `TemplateValidator`, `OfficialTemplate` completo | Cubierto |
| Ver enunciado | `TemplateBrowser`, `OfficialTemplate.statement` | Cubierto |
| Configurar predictor | `PredictorConfigurator`, `PredictorConfig` especializado, `ConfigurePredictorUseCase` | Cubierto |
| Predictor de un nivel | `OneLevelConfig`, `OneLevelPredictor`, `SaturatingCounter` | Cubierto |
| Predictor multinivel `(n,m)` | `TwoLevelConfig`, `TwoLevelPredictor`, `HistoryRegister`, `SaturatingCounter` | Cubierto |
| Correlacionado global | `GlobalCorrelatedConfig`, `GlobalCorrelatedPredictor` | Cubierto |
| `gshare` | `GshareConfig`, `GsharePredictor`, `XorIndexer`, `IndexCalculation` | Cubierto |
| `gselect` | `GselectConfig`, `GselectPredictor`, `ConcatenatingIndexer`, `IndexCalculation` | Cubierto |
| Correlacionado local | `LocalCorrelatedConfig`, `LocalCorrelatedPredictor`, historias locales | Cubierto |
| Presets por predictor | `PredictorPresetCatalog`, `PredictorPreset`, plantillas oficiales | Cubierto |
| Detectar saltos RISC-V | `ParseRiscVUseCase`, `RiscVProgram`, `Branch` | Cubierto |
| Subconjunto RISC-V inicial | `RiscVSubsetSpec`, `ParseRiscVUseCase`, `TranslateCUseCase` | Cubierto como especificación configurable |
| Generar RISC-V desde C | `TranslateCUseCase`, `SourceBundle` | Cubierto |
| Bloquear C si RISC-V se edita | `SourceBundle.syncState`, `SourceSyncPolicy`, casos de uso de edición | Cubierto |
| No guardar C desincronizado | `SourceBundle.isCSourcePersistable()`, `SourceSyncPolicy`, `SessionYamlMapper` | Cubierto |
| Introducir secuencia manual | `SequenceTable`, `BranchSequence`, `BranchExecution` | Cubierto |
| Definir bucles visuales | `LoopRange`, `SequenceExpander` | Cubierto |
| Saltar bucle completo | `SkipLoopUseCase`, `SequenceExpander`, `LoopSummary` | Cubierto |
| Simular paso a paso | `StepSimulationUseCase`, `SimulationEngine`, `TraceStep` | Cubierto |
| Simular de golpe | `RunSimulationUseCase`, `SimulationEngine` | Cubierto |
| Reiniciar | caso de uso de simulación y estado de sesión | Cubierto |
| Retroceder pasos | `StepBackUseCase`, historial de trazas/snapshots | Previsto |
| Tabla dinámica | `TableProjector`, `TraceStep`, `PredictionTrace`, `UpdateTrace` | Cubierto |
| Modo examen | `SessionMode`, `ModeSwitcher`, reglas de proyección | Cubierto |
| Modo solución | `SessionMode`, `OfficialSolution`, `CalculationViewBuilder` | Cubierto |
| Edición/comprobación manual | `UserSolution`, `AnswerChecker`, `CorrectionReport` | Cubierto |
| Estadísticas bajo demanda | `CalculateStatsUseCase`, `StatsCalculator`, `StatisticsSet` | Cubierto |
| Corrección de estadísticas | `StatAnswerParser`, `TolerancePolicy`, `AnswerChecker` | Cubierto |
| Cálculos compactos/expandibles | `PredictionTrace`, `UpdateTrace`, `CalculationViewBuilder` | Cubierto |
| Aliasing | `IndexCalculation`, `AliasingEvent`, `StatisticsSet.aliasingEvents` | Cubierto |
| Importar/exportar YAML | `ImportYamlUseCase`, `ExportYamlUseCase`, `SessionRepository`, `SessionYamlMapper` | Cubierto |
| Persistencia automática | `DraftRepository`, `LocalStorageDraftRepository` | Cubierto como deseable |
| Exportar CSV/Markdown/imagen | `ExportTableUseCase`, `Exporter`, exportadores concretos | Cubierto |
| Idioma ES/EN | `I18nCatalogPort`, `I18nCatalogAdapter`, `StudySession.language` | Cubierto |
| UI local Material-like | `PresentationLayer`, componentes de UI, separación de dominio | Cubierto a nivel arquitectónico |
| Plantillas ejercicios 1, 2, 3, 4, 5 y 7 | `OfficialTemplate`, `TemplateRepository`, `TemplateValidator` | Cubierto |
| Extensión Tournament/TAGE | `FutureTournamentConfig`, `FutureTageConfig`, `TournamentPredictor`, `TagePredictor` | Previsto |
| Pipeline/ROB/pila de retorno/penalizaciones | nuevos modelos de dominio y casos de uso sobre el motor, sin tocar UI principal | Previsto |

No queda ningún requisito principal de v1 sin pieza arquitectónica asociada. Los puntos marcados como `Previsto` corresponden a requisitos opcionales o futuros según `REQUISITOS.md`.

## 25. Decisiones finales de diseño

- El motor de simulación se alimenta de `BranchSequence`, no del C.
- El RISC-V sirve para detectar saltos, direcciones, etiquetas y resaltar instrucciones.
- El C sirve para generar RISC-V didáctico y puede quedar bloqueado si el usuario edita RISC-V.
- Las plantillas oficiales se tratan como datos versionados y validados.
- La traza canónica es la fuente para tablas, cálculos, estadísticas, corrección y exportación.
- La configuración de predictores se especializa por tipo para evitar ambigüedad.
- La arquitectura usa composición y estrategias antes que herencia profunda.
- La capa de aplicación depende de puertos; la infraestructura implementa adaptadores.
- La UI decide presentación y visibilidad por modo, pero no calcula predicciones.
