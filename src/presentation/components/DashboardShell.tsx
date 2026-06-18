import { Alert, Box, Stack, Tab, Tabs, Typography } from "@mui/material";
import { CalculationPanel } from "./CalculationPanel";
import { ConfigurationPanel } from "./ConfigurationPanel";
import { ImportSessionPanel } from "./ImportSessionPanel";
import { SimulationTablePanel } from "./SimulationTablePanel";
import { SourceEditorsPanel } from "./SourceEditorsPanel";
import { useSimulationStore } from "../stores/simulationStore";
import { visualTokens } from "../theme/tokens";

export function DashboardShell() {
  const {
    templates,
    selectedTemplateId,
    selectedVariantId,
    activeTitle,
    activeStatement,
    activeVariantTitle,
    predictorConfigSource,
    predictorConfigError,
    mode,
    cSource,
    riscVSource,
    sourceSyncState,
    manualSequenceSource,
    manualSequenceError,
    totalSteps,
    sessionYamlInput,
    sessionImportError,
    statAnswerInputs,
    tableAnswerSource,
    tableAnswerError,
    correctionReport,
    translationDiagnostics,
    currentStep,
    tableView,
    exportedTable,
    exportedSessionYaml,
    statistics,
    calculationViews,
    selectTemplate,
    selectVariant,
    updateCSource,
    updateRiscVSource,
    updateManualSequenceSource,
    updatePredictorConfigSource,
    updateSessionYamlInput,
    updateStatAnswer,
    updateTableAnswerSource,
    importSessionYaml,
    setMode,
    step,
    stepBack,
    runAll,
    reset,
    calculateStats,
    revealCalculations,
    checkAnswers,
    exportTable,
    exportSessionYaml
  } = useSimulationStore();
  return (
    <Box
      sx={{
        bgcolor: "background.default",
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "320px minmax(0, 1fr)" },
        minHeight: "100vh"
      }}
    >
      <Box
        component="aside"
        sx={{
          bgcolor: visualTokens.color.surface,
          borderBottom: { xs: 1, lg: 0 },
          borderColor: "divider",
          borderRight: { lg: 1 },
          maxHeight: { lg: "100vh" },
          overflowY: { lg: "auto" },
          position: { lg: "sticky" },
          top: 0
        }}
      >
        <Stack
          spacing={1.5}
          sx={{
            p: 1.5
          }}
        >
          <Box>
            <Typography component="h1" variant="h1">
              Branch Predictor Simulator
            </Typography>
            <Typography variant="body2">Canonical UCM branch prediction tables.</Typography>
          </Box>
          <Tabs
            value={mode}
            aria-label="Work mode"
            variant="fullWidth"
            onChange={(_event, value: "exam" | "solution") => setMode(value)}
            sx={{
              bgcolor: visualTokens.color.surfaceSoft,
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
              minHeight: 40
            }}
          >
            <Tab value="exam" label="Exam" />
            <Tab value="solution" label="Solution" />
          </Tabs>
          <ConfigurationPanel
            templates={templates}
            selectedTemplateId={selectedTemplateId}
            selectedVariantId={selectedVariantId}
            activeTitle={activeTitle}
            activeStatement={activeStatement}
            activeVariantTitle={activeVariantTitle}
            traceCount={currentStep}
            predictorConfigSource={predictorConfigSource}
            predictorConfigError={predictorConfigError}
            statAnswerInputs={statAnswerInputs}
            tableAnswerSource={tableAnswerSource}
            tableAnswerError={tableAnswerError}
            correctionReport={correctionReport}
            statistics={statistics}
            onSelectTemplate={selectTemplate}
            onSelectVariant={selectVariant}
            onPredictorConfigSourceChange={updatePredictorConfigSource}
            onTableAnswerSourceChange={updateTableAnswerSource}
            onStatAnswerChange={updateStatAnswer}
            onCheckAnswers={checkAnswers}
            onCalculateStats={calculateStats}
          />
          <ImportSessionPanel
            sessionYamlInput={sessionYamlInput}
            sessionImportError={sessionImportError}
            onSessionYamlInputChange={updateSessionYamlInput}
            onImport={importSessionYaml}
          />
        </Stack>
      </Box>

      <Stack
        component="main"
        spacing={1.5}
        sx={{
          minWidth: 0,
          p: { xs: 1.25, md: 2 }
        }}
      >
        <SourceEditorsPanel
          cSource={cSource}
          riscVSource={riscVSource}
          sourceSyncState={sourceSyncState}
          manualSequenceSource={manualSequenceSource}
          onCSourceChange={updateCSource}
          onRiscVSourceChange={updateRiscVSource}
          onManualSequenceChange={updateManualSequenceSource}
        />
        {manualSequenceError ? <Alert severity="warning">{manualSequenceError}</Alert> : undefined}
        {translationDiagnostics.length > 0 ? (
          <Stack spacing={1}>
            {translationDiagnostics.map((diagnostic) => (
              <Alert key={`${diagnostic.severity}-${diagnostic.message}`} severity={diagnostic.severity}>
                {diagnostic.message}
              </Alert>
            ))}
          </Stack>
        ) : undefined}

        <SimulationTablePanel
          currentStep={currentStep}
          totalSteps={totalSteps}
          tableView={tableView}
          exportedTable={exportedTable}
          exportedSessionYaml={exportedSessionYaml}
          onStep={step}
          onStepBack={stepBack}
          onRunAll={runAll}
          onReset={reset}
          onExportCsv={() => exportTable("csv")}
          onExportMarkdown={() => exportTable("markdown")}
          onExportSessionYaml={exportSessionYaml}
        />
        <CalculationPanel
          mode={mode}
          traceCount={currentStep}
          calculationViews={calculationViews}
          onRevealCalculations={revealCalculations}
        />
      </Stack>
    </Box>
  );
}
