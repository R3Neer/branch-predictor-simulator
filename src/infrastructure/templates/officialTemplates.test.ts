import { describe, expect, it } from "vitest";
import { officialTemplates } from "./officialTemplates";
import { TemplateValidator } from "./TemplateValidator";

describe("officialTemplates", () => {
  it("includes v1 official exercises and excludes Tournament exercise 6", () => {
    expect(officialTemplates.map((template) => template.exerciseNumber)).toEqual([1, 2, 3, 4, 5, 7]);
  });

  it("keeps every v1 official template verified", () => {
    expect(officialTemplates.every((template) => template.verificationStatus === "verified")).toBe(true);
  });

  it("validates template structure for every official v1 exercise", () => {
    const reports = officialTemplates.map((template) => new TemplateValidator().validate(template));

    expect(reports.every((report) => report.valid)).toBe(true);
  });

  it("executes exercise 1 without validation warnings", () => {
    const report = new TemplateValidator().validate(officialTemplates[0]);

    expect(report.warnings).toEqual([]);
  });

  it("keeps verified templates warning-free", () => {
    const reports = officialTemplates
      .filter((template) => template.verificationStatus === "verified")
      .map((template) => new TemplateValidator().validate(template));

    expect(reports.every((report) => report.valid && report.warnings.length === 0)).toBe(true);
  });

  it("captures official gshare exercise statistics", () => {
    const exercise5 = officialTemplates.find((template) => template.exerciseNumber === 5);
    expect(exercise5?.verificationStatus).toBe("verified");
    expect(exercise5?.variants[0].expectedStatistics).toMatchObject({
      hits: 5,
      misses: 11,
      usedEntries: 9
    });
  });

  it("treats verified template statistic mismatches as blocking errors", () => {
    const verified = officialTemplates[0];
    const report = new TemplateValidator().validate({
      ...verified,
      variants: [
        {
          ...verified.variants[0],
          expectedStatistics: { ...verified.variants[0].expectedStatistics, hits: 99 }
        }
      ]
    });

    expect(report.valid).toBe(false);
    expect(report.errors[0]).toContain("expected 99 hits");
  });

  it("treats verified template rate mismatches as blocking errors", () => {
    const verified = officialTemplates[0];
    const report = new TemplateValidator().validate({
      ...verified,
      variants: [
        {
          ...verified.variants[0],
          expectedStatistics: { ...verified.variants[0].expectedStatistics, hitRate: 0.99 }
        }
      ]
    });

    expect(report.valid).toBe(false);
    expect(report.errors[0]).toContain("expected hit rate 0.99");
  });

  it("treats verified template used-entry mismatches as blocking errors", () => {
    const verified = officialTemplates.find((template) => template.exerciseNumber === 5);
    expect(verified).toBeDefined();

    const report = new TemplateValidator().validate({
      ...verified!,
      variants: [
        {
          ...verified!.variants[0],
          expectedStatistics: { ...verified!.variants[0].expectedStatistics, usedEntries: 99 }
        }
      ]
    });

    expect(report.valid).toBe(false);
    expect(report.errors[0]).toContain("expected 99 used entries");
  });

  it("keeps non-certified template discrepancies as warnings", () => {
    const draft = { ...officialTemplates[0], verificationStatus: "draft" as const };

    const report = new TemplateValidator().validate({
      ...draft,
      variants: [
        {
          ...draft.variants[0],
          expectedStatistics: { ...draft.variants[0].expectedStatistics, hits: 99 }
        }
      ]
    });

    expect(report.valid).toBe(true);
    expect(report.warnings[0]).toContain("expected 99 hits");
  });

  it("keeps draft rate discrepancies as warnings", () => {
    const draft = { ...officialTemplates[0], verificationStatus: "draft" as const };

    const report = new TemplateValidator().validate({
      ...draft,
      variants: [
        {
          ...draft.variants[0],
          expectedStatistics: { ...draft.variants[0].expectedStatistics, hitRate: 0.99 }
        }
      ]
    });

    expect(report.valid).toBe(true);
    expect(report.warnings.some((warning) => warning.includes("expected hit rate 0.99"))).toBe(true);
  });

  it("validates declared stable hit ranges", () => {
    const exercise7 = officialTemplates.find((template) => template.exerciseNumber === 7);
    expect(exercise7).toBeDefined();

    const report = new TemplateValidator().validate({
      ...exercise7!,
      variants: [
        {
          ...exercise7!.variants[0],
          officialSolution: { ...exercise7!.variants[0].officialSolution, stableFromStep: 1 }
        }
      ]
    });

    expect(report.valid).toBe(false);
    expect(report.errors.some((error) => error.includes("not all predictions hit from step 1"))).toBe(true);
  });
});
