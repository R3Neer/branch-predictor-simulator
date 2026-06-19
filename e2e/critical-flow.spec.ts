import { expect, type Page, test } from "@playwright/test";

test("runs, reveals, checks, and exports a simulation", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Branch Predictor Simulator" })).toBeVisible();
  await expect(page.getByText("No executed steps")).toBeVisible();
  await expect(page.getByRole("button", { name: "Back" })).toBeDisabled();

  await page.getByRole("button", { name: "Run all" }).click();
  await expect(page.getByText("Step 6 / 6")).toBeVisible();
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByText("Step 5 / 6")).toBeVisible();
  await page.getByRole("button", { name: "Run all" }).click();
  await expect(page.getByText("Step 6 / 6")).toBeVisible();

  await page.getByRole("tab", { name: "Solution" }).click();
  await expect(page.getByRole("cell", { name: "Miss" }).first()).toBeVisible();

  await openSection(page, "Calculations");
  await page.getByRole("button", { name: "Show calculations" }).click();
  await expect(page.getByText(/Step 1:/)).toBeVisible();
  await expect(page.locator("#calculations-panel").getByText("Counter").first()).toBeVisible();

  await openSection(page, "Statistics");
  await page.getByRole("button", { name: "Calculate" }).click();
  await expect(page.getByRole("textbox", { name: "Hit rate", exact: true })).toHaveValue("16.67%");
  await expect(page.getByRole("textbox", { name: "Miss rate", exact: true })).toHaveValue("83.33%");

  await openSection(page, "Answers");
  await page.getByLabel("Hits answer").fill("1");
  await page.getByLabel("Misses answer").fill("5");
  await page.getByLabel("Hit rate answer").fill("16.67%");
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.getByText("3 / 3 correct answers")).toBeVisible();

  await exportOption(page, "Table as Markdown");
  await expect(page.getByRole("textbox", { name: "Table export" })).toContainText("| Iteration | Branch |");
  await expect(page.getByRole("button", { name: "Copy" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Download" })).toBeVisible();
  await closeExportDialog(page);

  await exportOption(page, "Session as YAML");
  const yaml = page.getByRole("textbox", { name: "YAML session" });
  await expect(yaml).toContainText("version: 1");
  await expect(yaml).not.toContainText("statistics:");
  await expect(yaml).not.toContainText("tableView:");
  await expect(page.getByRole("button", { name: "Copy" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Download" })).toBeVisible();
  await closeExportDialog(page);
});

test("round-trips a manually edited sequence through YAML import", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("tab", { name: "Manual sequence" }).click();
  await page.getByLabel("Comment 1").fill("edited");
  await page.getByRole("button", { name: "Add row" }).click();
  await page.getByLabel("Outcome 7").selectOption("NT");
  await page.getByRole("button", { name: "Run all" }).click();
  await expect(page.getByText("Step 7 / 7")).toBeVisible();

  await exportOption(page, "Session as YAML");
  const exportedYaml = await page.getByRole("textbox", { name: "YAML session" }).inputValue();
  expect(exportedYaml).toContain("comment: edited");
  expect(exportedYaml).toContain("actual: NT");
  await closeExportDialog(page);

  await page.getByRole("tab", { name: "Didactic C" }).click();
  await page.getByLabel("Didactic C").fill("int a = 10; int i = 0; for (; i < 3; i++) a += i;");
  await page.getByRole("tab", { name: "RISC-V" }).click();
  await expect(page.getByLabel("RISC-V")).toContainText("addi x7, x0, 3");

  await page.getByRole("button", { name: "Import YAML" }).click();
  await page.getByLabel("Session YAML input").fill(exportedYaml);
  await page.getByRole("button", { name: "Import", exact: true }).click();

  await page.getByRole("tab", { name: "Manual sequence" }).click();
  await expect(page.getByLabel("Comment 1")).toHaveValue("edited");
  await expect(page.getByLabel("Outcome 7")).toHaveValue("NT");
  await expect(page.getByText("Step 0 / 7")).toBeVisible();
});

test("loads an official template variant and recalculates canonical statistics", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("combobox", { name: "Template" }).click();
  await page.getByRole("option", { name: "Exercise 2: two-level (1,1) and (1,2)" }).click();
  await expect(page.getByRole("textbox", { name: "Session", exact: true })).toHaveValue(
    "Exercise 2: two-level (1,1) and (1,2)"
  );
  await expect(page.getByText("Step 0 / 15")).toBeVisible();

  await page.getByRole("combobox", { name: "Variant" }).click();
  await page.getByRole("option", { name: "Two-level predictor (1,2)" }).click();
  await expect(page.getByRole("textbox", { name: "Active variant", exact: true })).toHaveValue(
    "Two-level predictor (1,2)"
  );
  await expect(page.getByText("Step 0 / 15")).toBeVisible();

  await page.getByRole("button", { name: "Run all" }).click();
  await expect(page.getByText("Step 15 / 15")).toBeVisible();

  await openSection(page, "Statistics");
  await page.getByRole("button", { name: "Calculate" }).click();
  await expect(page.getByRole("textbox", { name: "Hits", exact: true })).toHaveValue("3");
  await expect(page.getByRole("textbox", { name: "Misses", exact: true })).toHaveValue("12");
  await expect(page.getByRole("textbox", { name: "Hit rate", exact: true })).toHaveValue("20.00%");
  await expect(page.getByRole("textbox", { name: "Miss rate", exact: true })).toHaveValue("80.00%");
});

async function exportOption(page: Page, name: string) {
  await page.getByRole("button", { name: "Export" }).click();
  await page.getByRole("menuitem", { name }).click();
}

async function closeExportDialog(page: Page) {
  await page.getByRole("button", { name: "Close" }).click();
}

async function openSection(page: Page, name: string) {
  const section = page.locator(`#${name.toLowerCase()}-header`);
  if ((await section.getAttribute("aria-expanded")) !== "true") {
    await section.click();
  }
}

test("keeps enriched predictor details hidden in exam mode", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("combobox", { name: "Template" }).click();
  await page.getByRole("option", { name: "Exercise 2: two-level (1,1) and (1,2)" }).click();
  await page.getByRole("button", { name: "Run all" }).click();

  await expect(page.getByRole("columnheader", { name: "History before" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Index calculation" })).toBeVisible();

  const firstRow = page.getByRole("row").nth(1);
  await expect(firstRow.getByRole("cell").nth(2)).toHaveText("");
  await expect(firstRow.getByRole("cell").nth(4)).toHaveText("");
  await expect(firstRow.getByRole("cell").nth(6)).toHaveText("");

  await page.getByRole("tab", { name: "Solution" }).click();
  await expect(firstRow.getByRole("cell").nth(2)).not.toHaveText("");
  await expect(firstRow.getByRole("cell").nth(4)).not.toHaveText("");
  await expect(firstRow.getByRole("cell").nth(6)).not.toHaveText("");
});

test("keeps the main workflow reachable on desktop and mobile widths", async ({ page }) => {
  for (const viewport of [
    { width: 1280, height: 900 },
    { width: 390, height: 844 }
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Branch Predictor Simulator" })).toBeVisible();
    await expect(page.getByLabel("Didactic C")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Source" })).toBeInViewport();
    await expect(page.getByRole("button", { name: "Run all" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Exam" })).toBeInViewport();
    await expect(page.getByRole("tab", { name: "Solution" })).toBeInViewport();

    await page.getByRole("button", { name: "Run all" }).click();
    await expect(page.getByRole("table", { name: "Simulation table" })).toBeVisible();
    await expect(page.getByText("Step 6 / 6")).toBeVisible();
  }
});

test("edits the predictor configuration from validated JSON", async ({ page }) => {
  await page.goto("/");

  await openSection(page, "Predictor");
  await page.getByLabel("Predictor configuration JSON").fill(`{
  "type": "one-level",
  "counterBits": 1,
  "entries": 1,
  "initialCounterValue": 0,
  "indexPolicy": {
    "type": "manual",
    "entries": 1
  }
}`);
  await page.getByRole("button", { name: "Run all" }).click();
  await openSection(page, "Statistics");
  await page.getByRole("button", { name: "Calculate" }).click();

  await expect(page.getByRole("textbox", { name: "Memory bits", exact: true })).toHaveValue("1");

  await page.getByLabel("Predictor configuration JSON").fill("{ nope");
  await expect(page.getByText("Predictor configuration must be valid JSON.")).toBeVisible();
});
