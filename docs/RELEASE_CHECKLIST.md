# V1 Release Checklist

Use this checklist before tagging or publishing a v1 build.

## 1. Install

- Run `npm.cmd install`.
- Confirm the install completes without unexpected package changes.

## 2. Required Gates

- Run `npm.cmd test`.
- Run `npm.cmd run test:e2e`.
- Run `npm.cmd run lint`.
- Run `npm.cmd run build`.
- Review build warnings and record any accepted warning.
- Confirm the GitHub `CI` workflow is green on `main`.
- Confirm the `Release And Deploy Pages` workflow is green for the published release.

## 3. Local App Smoke

- Run `npm.cmd run dev`.
- Open the local Vite URL.
- Load an official template.
- Select a non-default variant.
- Edit the predictor configuration JSON and verify invalid JSON shows a validation error.
- Run one step forward.
- Run one step backward.
- Run the full simulation.
- Reset the simulation.

## 4. Exam And Solution Modes

- In Exam mode, verify prediction, counter, hit/miss, history, calculation, and aliasing details are hidden until an explicit action.
- In Solution mode, reveal calculations and verify they match the visible trace.
- Calculate statistics and verify the values are trace-derived.
- Check a small set of user-entered statistic answers.

## 5. Import And Export

- Export the table as Markdown.
- Export the table as CSV.
- Export the session as YAML.
- Verify YAML does not contain derived statistics or table data.
- Import the exported YAML into a fresh session.
- Verify branch sequence, predictor configuration, source sync state, and mode are preserved.

## 6. Official Templates

- Load exercises 1, 2, 3, 4, 5, and 7.
- Run each template with every v1 variant.
- Calculate statistics and compare with the expected template statistics.
- Confirm exercise 6 is not exposed as a v1 template.

## 7. UI Review

- Check desktop layout at a dense working width.
- Check tablet/mobile stacking and horizontal table scrolling.
- Verify accessible names for tabs, selects, buttons, text areas, and exported text fields.
- Verify focus remains visible through MUI defaults.
- Confirm all project and UI text is English-only.

## 8. Dependency Review

- Run `npm.cmd audit`.
- Prefer targeted dependency upgrades.
- Do not use forced breaking audit fixes without a separate decision.

## 9. GitHub Pages

- Confirm repository Pages source is set to GitHub Actions.
- Publish a GitHub Release.
- Confirm the release workflow runs tests before deployment.
- Confirm the deployed Pages URL opens the simulator.
