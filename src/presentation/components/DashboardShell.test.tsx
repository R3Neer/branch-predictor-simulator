import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "../screens/App";
import { useSimulationStore } from "../stores/simulationStore";

describe("DashboardShell", () => {
  beforeEach(() => {
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

  it("runs a template step and calculates statistics from the domain trace", () => {
    render(<App />);

    expect(screen.getByText("No executed steps")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Step" }));
    expect(screen.getByText("Step 1 / 6")).toBeInTheDocument();
    expect(screen.getByText("B1")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Calculate" }));
    expect(screen.getByLabelText("Misses")).toHaveValue("1");
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
    fireEvent.click(screen.getByRole("button", { name: "Show calculations" }));

    expect(screen.getByText(/Step 1:/)).toBeInTheDocument();
    expect(screen.getAllByText("Index").length).toBeGreaterThan(1);
    expect(screen.getByText("Counter")).toBeInTheDocument();
  });

  it("regenerates didactic RISC-V when the C source changes", () => {
    render(<App />);

    expect((screen.getAllByRole("textbox")[1] as HTMLTextAreaElement).value).toContain("bge x7, x5, end");

    fireEvent.change(screen.getAllByRole("textbox")[0], {
      target: { value: "int a = 10; int i = 0; for (; i < 3; i++) a += i;" }
    });

    expect(screen.getByDisplayValue(/addi x7, x0, 3/)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/add x5, x5, x6/)).toBeInTheDocument();
  });

  it("exports the current projected table to Markdown", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Step" }));
    fireEvent.click(screen.getByRole("button", { name: "Markdown" }));

    const exportArea = screen.getByLabelText("Export") as HTMLTextAreaElement;
    expect(exportArea.value).toContain("| Iteration | Branch |");
    expect(exportArea.value).toContain("| 1 | B1 |");
  });

  it("checks statistic answers without revealing expected values", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Run all" }));
    fireEvent.change(screen.getByLabelText("Hits answer"), {
      target: { value: "0" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Check" }));

    expect(screen.getByText(/correct answers/)).toBeInTheDocument();
  });

  it("checks table answers from user input", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Step" }));
    fireEvent.change(screen.getByLabelText("Table answers"), {
      target: { value: "1 pred=T hit=miss" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Check" }));

    expect(screen.getByText("2 / 2 correct answers")).toBeInTheDocument();
  });

  it("runs and exports a manually edited branch sequence", () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText("Manual sequence"), {
      target: { value: "B1 T index=0 # edited\nB1 NT index=0" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Run all" }));

    expect(screen.getByText("Step 2 / 2")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "YAML" }));
    const yamlArea = screen.getByLabelText("YAML session") as HTMLTextAreaElement;
    expect(yamlArea.value).toContain("comment: edited");
    expect(yamlArea.value).toContain("actual: NT");
  });

  it("exports the current editable input as YAML without derived statistics", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Step" }));
    fireEvent.click(screen.getByRole("button", { name: "Calculate" }));
    fireEvent.click(screen.getByRole("button", { name: "YAML" }));

    const yamlArea = screen.getByLabelText("YAML session") as HTMLTextAreaElement;
    expect(yamlArea.value).toContain("version: 1");
    expect(yamlArea.value).toContain("cSource:");
    expect(yamlArea.value).toContain("riscVSource:");
    expect(yamlArea.value).toContain("branchSequence:");
    expect(yamlArea.value).not.toContain("statistics:");
    expect(yamlArea.value).not.toContain("tableView:");
  });

  it("imports a YAML session and restores its editable sources", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "YAML" }));
    const exportedYaml = (screen.getByLabelText("YAML session") as HTMLTextAreaElement).value;

    fireEvent.change(screen.getAllByRole("textbox")[0], {
      target: { value: "int a = 10; int i = 0; for (; i < 3; i++) a += i;" }
    });
    expect((screen.getAllByRole("textbox")[1] as HTMLTextAreaElement).value).toContain("addi x7, x0, 3");

    fireEvent.change(screen.getByLabelText("Session YAML input"), {
      target: { value: exportedYaml }
    });
    fireEvent.click(screen.getByRole("button", { name: "Import" }));

    const textboxes = screen.getAllByRole("textbox") as HTMLTextAreaElement[];
    expect(textboxes[0].value).toContain("#define N 10");
    expect(textboxes[1].value).toContain("bge x7, x5, end");
    expect(screen.getByText("Step 0 / 6")).toBeInTheDocument();
  });

  it("blocks C and omits it from YAML after manual RISC-V edits", () => {
    render(<App />);

    const [cEditor, riscVEditor] = screen.getAllByRole("textbox") as HTMLTextAreaElement[];
    fireEvent.change(riscVEditor, {
      target: { value: "0x00 bne x1, x2, loop # B1" }
    });

    expect(cEditor).toHaveAttribute("readonly");
    expect(screen.getByText(/RISC-V was edited manually/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "YAML" }));
    const yamlArea = screen.getByLabelText("YAML session") as HTMLTextAreaElement;
    expect(yamlArea.value).toContain("syncState: desynced");
    expect(yamlArea.value).not.toContain("cSource:");
  });
});
