import { expect, test } from "@playwright/test";

test("runs, reveals, checks, and exports a simulation", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Branch Predictor Simulator" })).toBeVisible();
  await expect(page.getByText("No executed steps")).toBeVisible();

  await page.getByRole("button", { name: "Run all" }).click();
  await expect(page.getByText("Step 6 / 6")).toBeVisible();

  await page.getByRole("tab", { name: "Solution" }).click();
  await expect(page.getByRole("cell", { name: "Miss" }).first()).toBeVisible();

  await page.getByRole("button", { name: "Show calculations" }).click();
  await expect(page.getByText(/Step 1:/)).toBeVisible();
  await expect(page.getByText("Counter").first()).toBeVisible();

  await page.getByRole("button", { name: "Calculate" }).click();
  await expect(page.getByRole("textbox", { name: "Hit rate", exact: true })).toHaveValue("16.67%");
  await expect(page.getByRole("textbox", { name: "Miss rate", exact: true })).toHaveValue("83.33%");

  await page.getByLabel("Hits answer").fill("1");
  await page.getByLabel("Misses answer").fill("5");
  await page.getByLabel("Hit rate answer").fill("16.67%");
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.getByText("3 / 3 correct answers")).toBeVisible();

  await page.getByRole("button", { name: "Markdown" }).click();
  await expect(page.getByLabel("Export")).toContainText("| Iteration | Branch |");

  await page.getByRole("button", { name: "YAML" }).click();
  const yaml = page.getByLabel("YAML session");
  await expect(yaml).toContainText("version: 1");
  await expect(yaml).not.toContainText("statistics:");
  await expect(yaml).not.toContainText("tableView:");
});

test("round-trips a manually edited sequence through YAML import", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Manual sequence").fill("B1 T index=0 # edited\nB1 NT index=0");
  await page.getByRole("button", { name: "Run all" }).click();
  await expect(page.getByText("Step 2 / 2")).toBeVisible();

  await page.getByRole("button", { name: "YAML" }).click();
  const exportedYaml = await page.getByLabel("YAML session").inputValue();
  expect(exportedYaml).toContain("comment: edited");
  expect(exportedYaml).toContain("actual: NT");

  await page.getByLabel("Didactic C").fill("int a = 10; int i = 0; for (; i < 3; i++) a += i;");
  await expect(page.getByLabel("RISC-V")).toContainText("addi x7, x0, 3");

  await page.getByLabel("Session YAML input").fill(exportedYaml);
  await page.getByRole("button", { name: "Import" }).click();

  await expect(page.getByLabel("Manual sequence")).toHaveValue("B1 T index=0 # edited\nB1 NT index=0");
  await expect(page.getByText("Step 0 / 2")).toBeVisible();
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

  await page.getByRole("button", { name: "Calculate" }).click();
  await expect(page.getByRole("textbox", { name: "Hits", exact: true })).toHaveValue("3");
  await expect(page.getByRole("textbox", { name: "Misses", exact: true })).toHaveValue("12");
  await expect(page.getByRole("textbox", { name: "Hit rate", exact: true })).toHaveValue("20.00%");
  await expect(page.getByRole("textbox", { name: "Miss rate", exact: true })).toHaveValue("80.00%");
});
