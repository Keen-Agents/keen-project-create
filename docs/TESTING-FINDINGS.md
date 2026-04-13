# keen-project-create — Testing Findings

**Date:** 2026-04-13
**Tests added:** 29
**Tests passing:** 29 (failing: 0; known-regression assertions: 7)
**Source files read:** 9

## High findings

### [F1] Template Selection Is Hardcoded To VS Code — HIGH
**File:** `dist/index.mjs:39-43`
**What it does:** Resolves the on-disk `default` and `vscode` template folders before copying one into the new project directory.
**What's wrong:** The conditional that should choose between the two templates is commented out, and `TEMPLATE_DIR` is unconditionally assigned to `TEMPLATE_VSCODE`. `--type default` therefore emits the VS Code scaffold silently.
**Repro:** `node dist/index.mjs demo-app --type default`
**Test that exposes it:** `tests/scaffold.test.ts:69`
**Notes for the cleanup pass:** Restore real template selection and keep the current regression assertions until both CLI forms and README examples are revalidated.

### [F2] `--type <value>` Without A Project Name Scaffolds Into The Type Name — HIGH
**File:** `dist/index.mjs:14-29`
**What it does:** Parses `--type` flags, then derives `projectNameArg` from every non-dash positional argument.
**What's wrong:** The value after `--type` is still treated as a positional argument, so `node dist/index.mjs --type vscode` creates a project named `vscode` instead of failing with the usage error.
**Repro:** `node dist/index.mjs --type vscode`
**Test that exposes it:** `tests/scaffold.test.ts:214`
**Notes for the cleanup pass:** Strip consumed flag values before positional parsing or switch to a real argument parser.

## Medium findings

### [F3] Every Successful Scaffold Forces A Real `npm install` — MEDIUM
**File:** `dist/index.mjs:91-97`, `dist/index.mjs:151-154`
**What it does:** Chooses `npm` as the package manager and runs `npm install` at the end of every successful scaffold.
**What's wrong:** There is no `--no-install` flag, env escape hatch, or offline mode. The CLI always shells out to `npm install`, which is expensive for users and had to be neutralized in tests via a fake-bin shim.
**Repro:** `node dist/index.mjs demo-app`
**Test that exposes it:** `tests/scaffold.test.ts:189`
**Notes for the cleanup pass:** Add an explicit opt-out flag or env var before moving this package into CI-heavy workflows.

### [F4] The Dormant `default` Template Has Drifted From The VS Code Scaffold — MEDIUM
**File:** `templates/default/package.json:13-15`, `templates/default/src/flows/Project.flow.json:1-4`, `templates/vscode/package.json:13-16`
**What it does:** Stores the on-disk assets that should back the `default` scaffold once Bug E is fixed.
**What's wrong:** The `default` template pins an older `keen-builder` version and only ships an empty top-level flow file. It has no agent folder, no split-flow instruction files, no VS Code config, and no prettier assets, so fixing Bug E alone would expose a materially weaker and structurally different scaffold.
**Repro:** Compare `templates/default/` with `templates/vscode/`, then run `node dist/index.mjs demo-app --type default` and observe that the bundle never exercises the default assets today.
**Test that exposes it:** `tests/scaffold.test.ts:69`
**Notes for the cleanup pass:** Decide whether `default` is meant to be a slim scaffold or whether it should be brought up to parity before template selection is re-enabled.

## Low findings

### [F5] README Usage Docs No Longer Match The Runtime CLI Surface — LOW
**File:** `readme.md:16-25`, `dist/index.mjs:14-25`
**What it does:** Documents only the positional `vscode` form, while the runtime also accepts undocumented `--type=value` and `--type value` forms.
**What's wrong:** The docs omit the real flag syntax and still imply a functioning non-VSCode “standard template”, which is no longer true because of Bug E.
**Repro:** Compare the README usage examples with `node dist/index.mjs demo-app --type=vscode` and `node dist/index.mjs demo-app --type default`.
**Test that exposes it:** `tests/scaffold.test.ts:76`
**Notes for the cleanup pass:** Update the README only after the template-selection behavior is corrected and the supported CLI syntax is finalized.
