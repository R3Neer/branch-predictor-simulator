import { create } from "zustand";
import {
  SimulationSessionService,
  type CTranslationDiagnostic,
  type BranchSequence,
  type CorrectionReport,
  type DynamicTableView,
  type Language,
  type SessionMode,
  type SourceSyncState,
  type StatisticKey,
  type StatisticsSet,
  type TableExportFormat,
  type TraceStep
} from "../../application";
import type { OfficialTemplate } from "../../infrastructure/templates/OfficialTemplate";
import { officialTemplates } from "../../infrastructure/templates/officialTemplates";
import { CsvTableExporter, MarkdownTableExporter } from "../../infrastructure/export/TableExporters";
import { SessionYamlMapper } from "../../infrastructure/persistence/SessionYamlMapper";

interface SimulationStoreState {
  readonly templates: readonly OfficialTemplate[];
  readonly selectedTemplateId: string;
  readonly selectedVariantId: string;
  readonly activeTitle: string;
  readonly activeStatement: string;
  readonly activeVariantTitle: string;
  readonly activeBranchSequence: BranchSequence;
  readonly activePredictorConfig: unknown;
  readonly language: Language;
  readonly mode: SessionMode;
  readonly cSource: string;
  readonly riscVSource: string;
  readonly sourceSyncState: SourceSyncState;
  readonly totalSteps: number;
  readonly sessionYamlInput: string;
  readonly sessionImportError?: string;
  readonly statAnswerInputs: Record<StatisticKey, string>;
  readonly correctionReport?: CorrectionReport;
  readonly translationDiagnostics: readonly CTranslationDiagnostic[];
  readonly currentStep: number;
  readonly trace: readonly TraceStep[];
  readonly tableView: DynamicTableView;
  readonly exportedTable?: string;
  readonly exportedSessionYaml?: string;
  readonly statistics?: StatisticsSet;
  readonly selectTemplate: (templateId: string) => void;
  readonly selectVariant: (variantId: string) => void;
  readonly updateCSource: (source: string) => void;
  readonly updateRiscVSource: (source: string) => void;
  readonly updateSessionYamlInput: (source: string) => void;
  readonly updateStatAnswer: (key: StatisticKey, value: string) => void;
  readonly importSessionYaml: () => void;
  readonly setMode: (mode: SessionMode) => void;
  readonly step: () => void;
  readonly runAll: () => void;
  readonly reset: () => void;
  readonly calculateStats: () => void;
  readonly checkAnswers: () => void;
  readonly exportTable: (format: TableExportFormat) => void;
  readonly exportSessionYaml: () => void;
}

const sessionService = new SimulationSessionService({
  sessionYamlMapper: new SessionYamlMapper(),
  tableExporters: {
    csv: new CsvTableExporter(),
    markdown: new MarkdownTableExporter()
  }
});
const emptyStatAnswerInputs: Record<StatisticKey, string> = {
  hits: "",
  misses: "",
  hitRate: "",
  missRate: "",
  memoryBits: "",
  usedEntries: "",
  aliasingEvents: ""
};

const initialTemplate = officialTemplates[0];
const initialVariant = initialTemplate.variants[0];
const initialCSource = `#define N 10
int a = 10;
int i = 0;
for (; i < N; i++) a -= i;
printf(a);`;
const initialTranslation = sessionService.translateSafely(initialCSource);

export const useSimulationStore = create<SimulationStoreState>((set, get) => ({
  templates: officialTemplates,
  selectedTemplateId: initialTemplate.id,
  selectedVariantId: initialVariant.id,
  activeTitle: initialTemplate.title,
  activeStatement: initialTemplate.statement,
  activeVariantTitle: initialVariant.title,
  activeBranchSequence: initialTemplate.branchSequence,
  activePredictorConfig: initialVariant.predictorConfig,
  language: "es",
  mode: "exam",
  cSource: initialCSource,
  riscVSource: initialTranslation.riscVSource,
  sourceSyncState: "synced",
  totalSteps: sessionService.expandedLength(initialTemplate.branchSequence),
  sessionYamlInput: "",
  statAnswerInputs: emptyStatAnswerInputs,
  translationDiagnostics: initialTranslation.diagnostics,
  currentStep: 0,
  trace: [],
  tableView: sessionService.project([], "exam"),
  selectTemplate: (templateId) => {
    const template = officialTemplates.find((candidate) => candidate.id === templateId) ?? initialTemplate;
    const variant = template.variants[0];
    set({
      selectedTemplateId: template.id,
      selectedVariantId: variant.id,
      activeTitle: template.title,
      activeStatement: template.statement,
      activeVariantTitle: variant.title,
      activeBranchSequence: template.branchSequence,
      activePredictorConfig: variant.predictorConfig,
      language: "es",
      totalSteps: sessionService.expandedLength(template.branchSequence),
      currentStep: 0,
      trace: [],
      statistics: undefined,
      correctionReport: undefined,
      statAnswerInputs: emptyStatAnswerInputs,
      exportedTable: undefined,
      exportedSessionYaml: undefined,
      sessionImportError: undefined,
      tableView: sessionService.project([], get().mode)
    });
  },
  selectVariant: (variantId) => {
    const state = get();
    const template =
      officialTemplates.find((candidate) => candidate.id === state.selectedTemplateId) ?? initialTemplate;
    const variant =
      template.variants.find((candidate) => candidate.id === variantId) ?? template.variants[0];

    set({
      selectedVariantId: variant.id,
      activeVariantTitle: variant.title,
      activePredictorConfig: variant.predictorConfig,
      currentStep: 0,
      trace: [],
      statistics: undefined,
      correctionReport: undefined,
      exportedTable: undefined,
      exportedSessionYaml: undefined,
      sessionImportError: undefined,
      tableView: sessionService.project([], state.mode)
    });
  },
  updateCSource: (source) => {
    const translation = sessionService.translateCToBranchSequence(source);
    set({
      cSource: source,
      riscVSource: translation.riscVSource,
      activeBranchSequence: translation.branchSequence,
      sourceSyncState: "synced",
      totalSteps: sessionService.expandedLength(translation.branchSequence),
      translationDiagnostics: translation.diagnostics,
      currentStep: 0,
      trace: [],
      statistics: undefined,
      correctionReport: undefined,
      exportedTable: undefined,
      tableView: sessionService.project([], get().mode),
      exportedSessionYaml: undefined
    });
  },
  updateRiscVSource: (source) => {
    set({
      riscVSource: source,
      sourceSyncState: "desynced",
      translationDiagnostics: [
        {
          severity: "warning",
          message: "El RISC-V fue editado manualmente; el C queda bloqueado y no se exportara en YAML."
        }
      ],
      currentStep: 0,
      trace: [],
      statistics: undefined,
      correctionReport: undefined,
      exportedTable: undefined,
      exportedSessionYaml: undefined,
      tableView: sessionService.project([], get().mode)
    });
  },
  updateSessionYamlInput: (source) => {
    set({ sessionYamlInput: source, sessionImportError: undefined });
  },
  updateStatAnswer: (key, value) => {
    set({
      statAnswerInputs: {
        ...get().statAnswerInputs,
        [key]: value
      },
      correctionReport: undefined
    });
  },
  importSessionYaml: () => {
    try {
      const session = sessionService.importSessionYaml(get().sessionYamlInput);
      set({
        activeTitle: session.title,
        activeStatement: "Sesion importada desde YAML.",
        activeVariantTitle: "Configuracion importada",
        activeBranchSequence: session.branchSequence,
        activePredictorConfig: session.predictorConfig,
        language: session.language,
        mode: session.mode,
        cSource: session.source.cSource ?? "",
        riscVSource: session.source.riscVSource,
        sourceSyncState: session.source.syncState,
        totalSteps: sessionService.expandedLength(session.branchSequence),
        translationDiagnostics: [],
        currentStep: 0,
        trace: [],
        statistics: undefined,
        correctionReport: undefined,
        statAnswerInputs: emptyStatAnswerInputs,
        exportedTable: undefined,
        exportedSessionYaml: undefined,
        sessionImportError: undefined,
        tableView: sessionService.project([], session.mode)
      });
    } catch (error) {
      set({
        sessionImportError: error instanceof Error ? error.message : "No se pudo importar la sesion YAML."
      });
    }
  },
  setMode: (mode) => {
    set({ mode, tableView: sessionService.project(get().trace, mode) });
  },
  step: () => {
    const state = get();
    const trace = sessionService.runTrace(
      state.activeBranchSequence,
      state.activePredictorConfig,
      state.currentStep + 1
    );
    set({
      currentStep: trace.length,
      trace,
      statistics: undefined,
      correctionReport: undefined,
      exportedTable: undefined,
      exportedSessionYaml: undefined,
      tableView: sessionService.project(trace, get().mode)
    });
  },
  runAll: () => {
    const state = get();
    const trace = sessionService.runTrace(state.activeBranchSequence, state.activePredictorConfig);
    set({
      currentStep: trace.length,
      trace,
      statistics: undefined,
      correctionReport: undefined,
      exportedTable: undefined,
      exportedSessionYaml: undefined,
      tableView: sessionService.project(trace, get().mode)
    });
  },
  reset: () => {
    set({
      currentStep: 0,
      trace: [],
      statistics: undefined,
      correctionReport: undefined,
      exportedTable: undefined,
      exportedSessionYaml: undefined,
      tableView: sessionService.project([], get().mode)
    });
  },
  calculateStats: () => {
    set({
      statistics: sessionService.calculateStats(get().trace, get().activePredictorConfig)
    });
  },
  checkAnswers: () => {
    set({
      correctionReport: sessionService.checkStatAnswers(
        get().statAnswerInputs,
        get().trace,
        get().activePredictorConfig
      )
    });
  },
  exportTable: (format) => {
    set({ exportedTable: sessionService.exportTable(format, get().tableView) });
  },
  exportSessionYaml: () => {
    const state = get();
    set({
      exportedSessionYaml: sessionService.exportSessionYaml({
        version: 1,
        title: state.activeTitle,
        language: state.language,
        mode: state.mode,
        predictorConfig: state.activePredictorConfig,
        source: {
          cSource: state.cSource,
          riscVSource: state.riscVSource,
          syncState: state.sourceSyncState
        },
        branchSequence: state.activeBranchSequence
      })
    });
  }
}));
