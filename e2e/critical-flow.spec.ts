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
