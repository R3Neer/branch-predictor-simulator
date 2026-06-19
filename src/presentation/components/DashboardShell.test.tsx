import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "../screens/App";
import { useSimulationStore } from "../stores/simulationStore";

describe("DashboardShell", () => {
  beforeEach(() => {
    cleanup();
    document.body.innerHTML = "";
    useSimulationStore.getState().selectTemplate("exercise-1-one-level-2bit");
    useSimulationStore.getState().reset();
    useSimulationStore.getState().updateCSource(`#define N 10
int a = 10;
int i = 0;
for (; i < N; i++) a -= i;
printf(a);`);
    useSimulationStore.getState().selectTemplate("exercise-1-one-level-2bit");
    useSimulationStore.getState().reset();
    useSimulationStore.setState({
      mode: "exam",
      sourceSyncState: "synced",
      exportedTable: undefined,
      exportedSessionYaml: undefined,
      sessionYamlInput: "",
      sessionImportError: undefined,
      tableAnswerSource: "",
      tableAnswerError: undefined,
      correctionReport: undefined
    });
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
  });

  it("runs a template step and calculates statistics from the domain trace", () => {
    render(<App />);

    expect(screen.getByText("No executed steps")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Step" }));
    expect(screen.getByText("Step 1 / 6")).toBeInTheDocument();
    expect(screen.getByText("B1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByText("Step 0 / 6")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
    openSection("Statistics");
    openSection("Answers");
    expect(screen.getByRole("button", { name: "Calculate" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Check" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Export" }));
    expect(screen.getByRole("menuitem", { name: "Table as CSV" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("menuitem", { name: "Table as Markdown" })).toHaveAttribute("aria-disabled", "true");
  });

  it("shows all canonical statistic outputs after calculation", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Run all" }));
    openSection("Statistics");
    fireEvent.click(screen.getByRole("button", { name: "Calculate" }));

    expect(screen.getByLabelText("Hit rate")).toHaveValue("16.67%");
    expect(screen.getByLabelText("Miss rate")).toHaveValue("83.33%");
    expect(screen.getByLabelText("Memory bits")).toHaveValue("2");
    expect(screen.getByLabelText("Used entries")).toHaveValue("1");
    expect(screen.getByLabelText("Aliasing events")).toHaveValue("0");
  });

  it("edits the active predictor configuration through validated JSON", () => {
    render(<App />);

    openSection("Predictor");
    const configEditor = screen.getByLabelText("Predictor configuration JSON");
    expect((configEditor as HTMLTextAreaElement).value).toContain('"type": "one-level"');

    fireEvent.change(configEditor, {
      target: {
        value: `{
  "type": "one-level",
  "counterBits": 1,
  "entries": 1,
  "initialCounterValue": 0,
  "indexPolicy": {
    "type": "manual",
    "entries": 1
  }
}`
      }
    });
    fireEvent.click(screen.getByRole("button", { name: "Run all" }));
    openSection("Statistics");
    fireEvent.click(screen.getByRole("button", { name: "Calculate" }));

    expect(screen.getByLabelText("Memory bits")).toHaveValue("1");

    fireEvent.change(configEditor, { target: { value: "{ nope" } });
    expect(screen.getByText("Predictor configuration must be valid JSON.")).toBeInTheDocument();
  });

  it("reveals prediction data in solution mode", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Step" }));
    expect(screen.getAllByRole("row")[1].children[4]).toHaveTextContent("");
    expect(screen.queryByRole("button", { name: "Show calculations" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Solution" }));
    expect(screen.getAllByRole("row")[1].children[4]).not.toHaveTextContent("");
  });

  it("reveals calculation views only after solution mode requests them", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Step" }));
    fireEvent.click(screen.getByRole("tab", { name: "Solution" }));

    expect(screen.queryByText(/Step 1:/)).not.toBeInTheDocument();
    openSection("Calculations");
    fireEvent.click(screen.getByRole("button", { name: "Show calculations" }));

    expect(screen.getByText(/Step 1:/)).toBeInTheDocument();
    expect(screen.getAllByText("Index").length).toBeGreaterThan(1);
    expect(screen.getByText("Counter")).toBeInTheDocument();
  });

  it("regenerates didactic RISC-V when the C source changes", () => {
    render(<App />);

    act(() => {
      useSimulationStore.getState().updateCSource("int a = 10; int i = 0; for (; i < 3; i++) a += i;");
    });

    fireEvent.click(screen.getByRole("tab", { name: "RISC-V" }));
    expect(screen.getByLabelText("RISC-V")).toHaveTextContent("addi x7, x0, 3");
    expect(screen.getByLabelText("RISC-V")).toHaveTextContent("add x5, x5, x6");
  });

  it("exports the current projected table to Markdown", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Step" }));
    exportOption("Table as Markdown");

    const exportArea = screen.getByRole("textbox", { name: "Table export" }) as HTMLTextAreaElement;
    expect(exportArea.value).toContain("| Iteration | Branch |");
    expect(exportArea.value).toContain("| 1 | B1 |");
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download" })).toBeInTheDocument();
    closeExportDialog();
  });

  it("checks statistic answers without revealing expected values", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Run all" }));
    openSection("Answers");
    fireEvent.change(screen.getByLabelText("Hits answer"), {
      target: { value: "0" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Check" }));

    expect(screen.getByText(/correct answers/)).toBeInTheDocument();
  });

  it("checks table answers from user input", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Step" }));
    openSection("Answers");
    fireEvent.change(screen.getByLabelText("Table answers"), {
      target: { value: "1 pred=T hit=miss" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Check" }));

    expect(screen.getByText("2 / 2 correct answers")).toBeInTheDocument();
  });

  it("runs and exports a manually edited branch sequence", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("tab", { name: "Manual sequence" }));
    fireEvent.change(screen.getByLabelText("Comment 1"), { target: { value: "edited" } });
    fireEvent.click(screen.getByRole("button", { name: "Add row" }));
    fireEvent.change(screen.getByLabelText("Outcome 2"), { target: { value: "NT" } });
    fireEvent.click(screen.getByRole("button", { name: "Run all" }));

    expect(screen.getByText("Step 7 / 7")).toBeInTheDocument();

    exportOption("Session as YAML");
    const yamlArea = screen.getByRole("textbox", { name: "YAML session" }) as HTMLTextAreaElement;
    expect(yamlArea.value).toContain("comment: edited");
    expect(yamlArea.value).toContain("actual: NT");
    closeExportDialog();
  });

  it("exports the current editable input as YAML without derived statistics", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Step" }));
    openSection("Statistics");
    fireEvent.click(screen.getByRole("button", { name: "Calculate" }));
    exportOption("Session as YAML");

    const yamlArea = screen.getByRole("textbox", { name: "YAML session" }) as HTMLTextAreaElement;
    expect(yamlArea.value).toContain("version: 1");
    expect(yamlArea.value).toContain("cSource:");
    expect(yamlArea.value).toContain("riscVSource:");
    expect(yamlArea.value).toContain("branchSequence:");
    expect(yamlArea.value).not.toContain("statistics:");
    expect(yamlArea.value).not.toContain("tableView:");
    closeExportDialog();
  });

  it("imports a YAML session and restores its editable sources", () => {
    render(<App />);

    openSetupAndAnswers();
    fireEvent.click(screen.getByRole("button", { name: "Import YAML" }));
    expect(screen.getByRole("button", { name: /^Import$/ })).toBeDisabled();
    act(() => {
      useSimulationStore.getState().exportSessionYaml();
    });
    const exportedYaml = useSimulationStore.getState().exportedSessionYaml ?? "";

    act(() => {
      useSimulationStore.getState().updateCSource("int a = 10; int i = 0; for (; i < 3; i++) a += i;");
    });
    fireEvent.click(screen.getByRole("tab", { name: "RISC-V" }));
    expect(screen.getByLabelText("RISC-V")).toHaveTextContent("addi x7, x0, 3");

    fireEvent.change(screen.getByLabelText("Session YAML input"), {
      target: { value: exportedYaml }
    });
    expect(screen.getByRole("button", { name: /^Import$/ })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: /^Import$/ }));

    fireEvent.click(screen.getByRole("tab", { name: "Didactic C" }));
    expect(screen.getByLabelText("Didactic C")).toHaveTextContent("#define N 10");
    fireEvent.click(screen.getByRole("tab", { name: "RISC-V" }));
    expect(screen.getByLabelText("RISC-V")).toHaveTextContent("bge x7, x5, end");
    expect(screen.getByText("Step 0 / 6")).toBeInTheDocument();
  });

  it("blocks C and omits it from YAML after manual RISC-V edits", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("tab", { name: "RISC-V" }));
    act(() => {
      useSimulationStore.getState().updateRiscVSource("0x00 bne x1, x2, loop # B1");
    });

    fireEvent.click(screen.getByRole("tab", { name: "Didactic C" }));
    expect(screen.getByLabelText("Didactic C")).toHaveAttribute("contenteditable", "false");
    expect(screen.getByText(/RISC-V was edited directly/)).toBeInTheDocument();

    exportOption("Session as YAML");
    const yamlArea = screen.getByRole("textbox", { name: "YAML session" }) as HTMLTextAreaElement;
    expect(yamlArea.value).toContain("syncState: desynced");
    expect(yamlArea.value).not.toContain("cSource:");
  });
});

function exportOption(name: string) {
  fireEvent.click(screen.getByRole("button", { name: "Export" }));
  fireEvent.click(screen.getByRole("menuitem", { name }));
}

function openSection(name: string) {
  openSetupAndAnswers();
  const button = screen.getByRole("button", { name });
  if (button.getAttribute("aria-expanded") !== "true") {
    fireEvent.click(button);
  }
}

function openSetupAndAnswers() {
  const setupButton = screen.queryByRole("button", { name: /Setup and answers/ });
  if (setupButton && setupButton.getAttribute("aria-expanded") !== "true") {
    fireEvent.click(setupButton);
  }
}

function closeExportDialog() {
  fireEvent.click(screen.getByRole("button", { name: "Close" }));
}
