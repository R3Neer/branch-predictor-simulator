import { AnswerChecker, type CorrectionReport, type StatisticKey } from "../domain/correction/AnswerChecker";
import { TableAnswerParser } from "../domain/correction/TableAnswerParser";
import type { BranchSequence } from "../domain/simulation/BranchSequence";
import type { TraceStep } from "../domain/simulation/TraceStep";
import type { StatisticsSet } from "../domain/stats/StatsCalculator";
import { CTranslator, type CTranslationResult } from "../domain/source/CTranslator";
import { ManualBranchSequenceParser } from "../domain/source/ManualBranchSequenceParser";
import { RiscVBranchSequenceAdapter } from "../domain/source/RiscVBranchSequenceAdapter";
import { RiscVParser } from "../domain/source/RiscVParser";
import type { SourceBundle } from "../domain/source/SourceBundle";
import { CalculationViewBuilder, type CalculationView } from "./projectors/CalculationViewBuilder";
import { TableProjector, type DynamicTableView, type SessionMode } from "./projectors/TableProjector";
import { TraceStatsRunner } from "./TraceStatsRunner";

export type TableExportFormat = "csv" | "markdown";

export interface TableExporterPort {
  export(tableView: DynamicTableView): string;
}

export interface SessionYamlPort {
  toYaml(session: PersistableStudySession): string;
  fromYaml(document: string): PersistableStudySession;
}

export interface PersistableStudySession {
  readonly version: 1;
  readonly title: string;
  readonly language: "en";
  readonly mode: "exam" | "solution";
  readonly predictorConfig: unknown;
  readonly source: SourceBundle;
  readonly branchSequence: BranchSequence;
  readonly userSolution?: unknown;
}

export interface CBranchSequenceTranslationResult extends CTranslationResult {
  readonly branchSequence: BranchSequence;
}

export interface SimulationSessionServiceDependencies {
  readonly tableProjector?: TableProjector;
  readonly cTranslator?: CTranslator;
  readonly riscVParser?: RiscVParser;
  readonly branchSequenceAdapter?: RiscVBranchSequenceAdapter;
  readonly manualBranchSequenceParser?: ManualBranchSequenceParser;
  readonly tableAnswerParser?: TableAnswerParser;
  readonly answerChecker?: AnswerChecker;
  readonly traceStatsRunner?: TraceStatsRunner;
  readonly calculationViewBuilder?: CalculationViewBuilder;
  readonly tableExporters: Record<TableExportFormat, TableExporterPort>;
  readonly sessionYamlMapper: SessionYamlPort;
}

export class SimulationSessionService {
  private readonly tableProjector: TableProjector;
  private readonly cTranslator: CTranslator;
  private readonly riscVParser: RiscVParser;
  private readonly branchSequenceAdapter: RiscVBranchSequenceAdapter;
  private readonly manualBranchSequenceParser: ManualBranchSequenceParser;
  private readonly tableAnswerParser: TableAnswerParser;
  private readonly answerChecker: AnswerChecker;
  private readonly traceStatsRunner: TraceStatsRunner;
  private readonly calculationViewBuilder: CalculationViewBuilder;
  private readonly tableExporters: Record<TableExportFormat, TableExporterPort>;
  private readonly sessionYamlMapper: SessionYamlPort;

  constructor(dependencies: SimulationSessionServiceDependencies) {
    this.tableProjector = dependencies.tableProjector ?? new TableProjector();
    this.cTranslator = dependencies.cTranslator ?? new CTranslator();
    this.riscVParser = dependencies.riscVParser ?? new RiscVParser();
    this.branchSequenceAdapter = dependencies.branchSequenceAdapter ?? new RiscVBranchSequenceAdapter();
    this.manualBranchSequenceParser =
      dependencies.manualBranchSequenceParser ?? new ManualBranchSequenceParser();
    this.tableAnswerParser = dependencies.tableAnswerParser ?? new TableAnswerParser();
    this.answerChecker = dependencies.answerChecker ?? new AnswerChecker();
    this.traceStatsRunner = dependencies.traceStatsRunner ?? new TraceStatsRunner();
    this.calculationViewBuilder = dependencies.calculationViewBuilder ?? new CalculationViewBuilder();
    this.tableExporters = dependencies.tableExporters;
    this.sessionYamlMapper = dependencies.sessionYamlMapper;
  }

  translateSafely(source: string): CTranslationResult {
    try {
      return this.cTranslator.translate(source);
    } catch (error) {
      return {
        riscVSource: "",
        diagnostics: [
          {
            severity: "warning",
            message: error instanceof Error ? error.message : "C source could not be translated."
          }
        ],
        branchOutcomeHints: []
      };
    }
  }

  translateCToBranchSequence(source: string): CBranchSequenceTranslationResult {
    const translation = this.translateSafely(source);
    const program = this.riscVParser.parse(translation.riscVSource);
    const reconstruction = this.branchSequenceAdapter.fromProgram(
      program,
      translation.branchOutcomeHints
    );

    return {
      ...translation,
      branchSequence: reconstruction.branchSequence,
      diagnostics: [...translation.diagnostics, ...reconstruction.diagnostics]
    };
  }

  parseManualBranchSequence(source: string): BranchSequence {
    return this.manualBranchSequenceParser.parse(source);
  }

  formatManualBranchSequence(sequence: BranchSequence): string {
    return this.manualBranchSequenceParser.format(sequence);
  }

  runTrace(branchSequence: BranchSequence, predictorConfig: unknown, limit = this.expandedLength(branchSequence)) {
    return this.traceStatsRunner.run(branchSequence, predictorConfig, limit).trace;
  }

  project(trace: readonly TraceStep[], mode: SessionMode) {
    return this.tableProjector.project(trace, {
      mode,
      language: "en",
      revealSolution: mode === "solution"
    });
  }

  expandedLength(branchSequence: BranchSequence) {
    return this.traceStatsRunner.expandedLength(branchSequence);
  }

  calculateStats(trace: readonly TraceStep[], predictorConfig: unknown): StatisticsSet {
    return this.traceStatsRunner.calculateFromTrace(trace, predictorConfig);
  }

  buildCalculationViews(trace: readonly TraceStep[], expanded = true): readonly CalculationView[] {
    return trace.map((step) =>
      expanded ? this.calculationViewBuilder.expanded(step) : this.calculationViewBuilder.compact(step)
    );
  }

  checkStatAnswers(
    inputs: Record<StatisticKey, string>,
    trace: readonly TraceStep[],
    predictorConfig: unknown
  ): CorrectionReport {
    const statAnswers = Object.entries(inputs)
      .filter(([, raw]) => raw.trim().length > 0)
      .map(([key, raw]) => ({ key: key as StatisticKey, raw }));

    return this.answerChecker.compare(
      { tableAnswers: [], statAnswers },
      trace,
      this.calculateStats(trace, predictorConfig)
    );
  }

  checkAnswers(
    tableAnswerSource: string,
    statInputs: Record<StatisticKey, string>,
    trace: readonly TraceStep[],
    predictorConfig: unknown
  ): CorrectionReport {
    const tableAnswers = this.tableAnswerParser.parse(tableAnswerSource);
    const statAnswers = Object.entries(statInputs)
      .filter(([, raw]) => raw.trim().length > 0)
      .map(([key, raw]) => ({ key: key as StatisticKey, raw }));

    return this.answerChecker.compare(
      { tableAnswers, statAnswers },
      trace,
      this.calculateStats(trace, predictorConfig)
    );
  }

  exportTable(format: TableExportFormat, tableView: DynamicTableView): string {
    return this.tableExporters[format].export(tableView);
  }

  importSessionYaml(source: string): PersistableStudySession {
    return this.sessionYamlMapper.fromYaml(source);
  }

  exportSessionYaml(session: PersistableStudySession): string {
    return this.sessionYamlMapper.toYaml(session);
  }
}
