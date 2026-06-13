import { AnswerChecker, type CorrectionReport, type StatisticKey } from "../domain/correction/AnswerChecker";
import { PredictorFactory } from "../domain/predictors/PredictorFactory";
import type { BranchSequence } from "../domain/simulation/BranchSequence";
import { SequenceExpander } from "../domain/simulation/SequenceExpander";
import { SimulationEngine } from "../domain/simulation/SimulationEngine";
import type { TraceStep } from "../domain/simulation/TraceStep";
import { StatsCalculator, type StatisticsSet } from "../domain/stats/StatsCalculator";
import { CTranslator, type CTranslationResult } from "../domain/source/CTranslator";
import type { SourceBundle } from "../domain/source/SourceBundle";
import { TableProjector, type DynamicTableView, type SessionMode } from "./projectors/TableProjector";

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
  readonly language: "es" | "en";
  readonly mode: "exam" | "solution";
  readonly predictorConfig: unknown;
  readonly source: SourceBundle;
  readonly branchSequence: BranchSequence;
  readonly userSolution?: unknown;
}

export interface SimulationSessionServiceDependencies {
  readonly tableProjector?: TableProjector;
  readonly predictorFactory?: PredictorFactory;
  readonly sequenceExpander?: SequenceExpander;
  readonly cTranslator?: CTranslator;
  readonly answerChecker?: AnswerChecker;
  readonly tableExporters: Record<TableExportFormat, TableExporterPort>;
  readonly sessionYamlMapper: SessionYamlPort;
}

export class SimulationSessionService {
  private readonly tableProjector: TableProjector;
  private readonly predictorFactory: PredictorFactory;
  private readonly sequenceExpander: SequenceExpander;
  private readonly cTranslator: CTranslator;
  private readonly answerChecker: AnswerChecker;
  private readonly tableExporters: Record<TableExportFormat, TableExporterPort>;
  private readonly sessionYamlMapper: SessionYamlPort;

  constructor(dependencies: SimulationSessionServiceDependencies) {
    this.tableProjector = dependencies.tableProjector ?? new TableProjector();
    this.predictorFactory = dependencies.predictorFactory ?? new PredictorFactory();
    this.sequenceExpander = dependencies.sequenceExpander ?? new SequenceExpander();
    this.cTranslator = dependencies.cTranslator ?? new CTranslator();
    this.answerChecker = dependencies.answerChecker ?? new AnswerChecker();
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

  runTrace(branchSequence: BranchSequence, predictorConfig: unknown, limit = this.expandedLength(branchSequence)) {
    const predictor = this.predictorFactory.create(predictorConfig);
    if (!predictor) {
      return [];
    }

    const limitedSequence = {
      executions: this.sequenceExpander.expand(branchSequence).slice(0, limit),
      loops: []
    };
    const engine = new SimulationEngine();

    return engine.runToCompletion(
      engine.initialise(limitedSequence, predictor as never, predictorConfig as never),
      predictor as never
    ).trace;
  }

  project(trace: readonly TraceStep[], mode: SessionMode) {
    return this.tableProjector.project(trace, {
      mode,
      language: "es",
      revealSolution: mode === "solution"
    });
  }

  expandedLength(branchSequence: BranchSequence) {
    return this.sequenceExpander.expand(branchSequence).length;
  }

  calculateStats(trace: readonly TraceStep[], predictorConfig: unknown): StatisticsSet {
    const predictor = this.predictorFactory.create(predictorConfig);
    const memoryUsage =
      predictor && "memoryUsage" in predictor
        ? (predictor.memoryUsage as (config: unknown) => { bits: number; entries: number })(
            predictorConfig
          )
        : undefined;

    return new StatsCalculator().calculate(trace, memoryUsage);
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
