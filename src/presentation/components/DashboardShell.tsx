import { Alert, AppBar, Box, Stack, Tab, Tabs, Toolbar, Typography } from "@mui/material";
import { CalculationPanel } from "./CalculationPanel";
import { ConfigurationPanel } from "./ConfigurationPanel";
import { ImportSessionPanel } from "./ImportSessionPanel";
import { SimulationTablePanel } from "./SimulationTablePanel";
import { SourceEditorsPanel } from "./SourceEditorsPanel";
import { useSimulationStore } from "../stores/simulationStore";

export function DashboardShell() {
  const {
    templates,
    selectedTemplateId,
    selectedVariantId,
    activeTitle,
    activeStatement,
    activeVariantTitle,
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
    updateSessionYamlInput,
    updateStatAnswer,
    updateTableAnswerSource,
    importSessionYaml,
    setMode,
    step,
    runAll,
    reset,
    calculateStats,
    revealCalculations,
    checkAnswers,
    exportTable,
    exportSessionYaml
  } = useSimulationStore();
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="static" color="inherit" elevation={0}>
        <Toolbar sx={{ gap: 2, borderBottom: 1, borderColor: "divider" }}>
          <Typography component="h1" variant="h1" sx={{ flexGrow: 1 }}>
            Branch Predictor Simulator
          </Typography>
          <Tabs
            value={mode}
            aria-label="Work mode"
            onChange={(_event, value: "exam" | "solution") => setMode(value)}
          >
            <Tab value="exam" label="Exam" />
            <Tab value="solution" label="Solution" />
          </Tabs>
        </Toolbar>
      </AppBar>

      <Box
        component="main"
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 320px" },
          gap: 2,
          p: 2
        }}
      >
        <Stack spacing={2} sx={{ minWidth: 0 }}>
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
          <ImportSessionPanel
            sessionYamlInput={sessionYamlInput}
            sessionImportError={sessionImportError}
            onSessionYamlInputChange={updateSessionYamlInput}
            onImport={importSessionYaml}
          />
        </Stack>

        <ConfigurationPanel
          templates={templates}
          selectedTemplateId={selectedTemplateId}
          selectedVariantId={selectedVariantId}
          activeTitle={activeTitle}
          activeStatement={activeStatement}
          activeVariantTitle={activeVariantTitle}
          statAnswerInputs={statAnswerInputs}
          tableAnswerSource={tableAnswerSource}
          tableAnswerError={tableAnswerError}
          correctionReport={correctionReport}
          statistics={statistics}
          onSelectTemplate={selectTemplate}
          onSelectVariant={selectVariant}
          onTableAnswerSourceChange={updateTableAnswerSource}
          onStatAnswerChange={updateStatAnswer}
          onCheckAnswers={checkAnswers}
          onCalculateStats={calculateStats}
        />
      </Box>
    </Box>
  );
}
