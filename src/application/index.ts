export type { BranchExecution, BranchSequence, LoopRange } from "../domain/simulation/BranchSequence";
export { SimulationEngine } from "../domain/simulation/SimulationEngine";
export type { RunStatus, SimulationRun } from "../domain/simulation/SimulationEngine";
export { SequenceExpander } from "../domain/simulation/SequenceExpander";
export type { TraceStep } from "../domain/simulation/TraceStep";
export { StatsCalculator } from "../domain/stats/StatsCalculator";
export type { LoopSummary, Ratio, StatisticsSet } from "../domain/stats/StatsCalculator";
export { AnswerChecker } from "../domain/correction/AnswerChecker";
export type {
  CellCorrection,
  CorrectionReport,
  StatAnswer,
  StatCorrection,
  TableAnswer,
  UserSolution
} from "../domain/correction/AnswerChecker";
export { StatAnswerParser } from "../domain/correction/StatAnswerParser";
export type { NormalizedStatAnswer } from "../domain/correction/StatAnswerParser";
export { CalculationViewBuilder } from "./projectors/CalculationViewBuilder";
export type { CalculationView } from "./projectors/CalculationViewBuilder";
export { TableProjector } from "./projectors/TableProjector";
export type { DynamicTableView, Language, SessionMode } from "./projectors/TableProjector";
export type { Outcome } from "../domain/shared/Outcome";
export { OneLevelPredictor } from "../domain/predictors/OneLevelPredictor";
export type { OneLevelConfig, OneLevelState } from "../domain/predictors/OneLevelPredictor";
