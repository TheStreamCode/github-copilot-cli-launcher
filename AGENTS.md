# Repository Agent Guide

## Scope

These instructions apply to the entire repository.

## Project Overview

Copilot CLI Launcher is a small, privacy-first VS Code extension published as a VSIX. It creates a
fresh side terminal and starts a user-configured GitHub Copilot CLI command. The extension must
remain unofficial, local-only, and free of telemetry, installers, or background network behavior.

The repository is **public** and MIT licensed. Treat everything committed here as world-readable:
no internal endpoints, customer data, credentials, or unreleased claims.

## Stack and Runtime

- TypeScript compiled by `tsc` (no bundler) to CommonJS-compatible `out/` via `module: NodeNext`,
  `target: ES2022`, `strict: true`.
- Runtime: the VS Code extension host. Declared engine floor is `^1.103.0`; `@types/vscode` must
  stay aligned with it.
- Tooling runtime: **Node.js 22** with **npm 11.16.0** (the versions CI uses).
- Package manager: **npm 11.16.0**, with the committed `package-lock.json`. Do not introduce a
  second package manager, lockfile, or a `packageManager` field — a metadata test asserts its
  absence.
- npm install scripts are denied unless their exact package version appears in `allowScripts`.
  Review the script before approving it with `npm approve-scripts`; never broaden an existing
  approval or carry it to a new dependency version without re-reviewing that version.
- No runtime dependencies. Everything in `devDependencies` is build, test, or packaging tooling.

## Source Layout

- `src/extension.ts`: VS Code activation, commands, terminal lifecycle, prompts, and
  shell-integration wiring. The only module allowed to import `vscode`.
- `src/command-utils.ts`: pure command parsing, risk classification, output bounding, naming,
  disposable bookkeeping, and workspace resolution helpers. Must stay free of `vscode` imports so
  it is unit-testable under plain Node.
- `test/command-utils.test.js`: `node:test` unit tests against the compiled `out/command-utils.js`.
- `test/metadata.test.js`: asserts package metadata, ignore rules, documentation, CI, and
  source-level invariants. Version-sensitive — update it with every version bump.
- `test/integration/`: VS Code integration smoke test driven by `@vscode/test-electron`.
- `media/icon.png`: the single packaged product artwork, used for both the Marketplace listing and
  the editor-title command icon.
- `docs/`: engineering notes and the release checklist.
- `.github/`: issue templates, pull request guidance, CI, and the Open VSX publish workflow.

## Required Commands

```powershell
npm ci --strict-allow-scripts
npm run check
npm run audit
```

- `npm run check` = clean compile, unit + metadata tests, VS Code integration smoke test, and
  `vsce ls` package-content validation. It is the single gate to run before any commit.
- Focused runs: `npm run test:unit`, `npm run test:integration`, `npm run test:metadata`,
  `npm run test:command-utils`.
- Build a release candidate only after those pass:

```powershell
npm run package -- -- --out .vsce/vscode-copilot-cli-launcher-<version>.vsix
```

## Generated and Ignored Files

Never commit or hand-edit: `node_modules/`, `out/`, `out/**/*.map`, `.vscode-test/`, `.vsce/`,
`*.vsix`, `*.tsbuildinfo`, logs. `out/` is wiped by `npm run clean` on every compile, so edits
there are lost. Edit `package-lock.json` only through npm.

## Engineering Guardrails

- Keep TypeScript strict and move reusable decision logic into pure functions in
  `command-utils.ts` with focused tests.
- Preserve Workspace Trust checks and resolve `copilotCliLauncher.cliCommand` from user or machine
  configuration only. A workspace must not be able to choose the command that is executed.
- Send the configured command exactly once. Shell-integration and fallback paths must remain
  mutually exclusive.
- Register per-launch listeners and timers through the disposable registry in
  `command-utils.ts`, never directly on `context.subscriptions`. VS Code drains `subscriptions`
  only at deactivate, so pushing there on every launch grows that array without bound and pins each
  launch's captured terminal output. A metadata test enforces a single `context.subscriptions.push`
  call in `extension.ts`.
- Keep captured terminal output bounded and in memory only; never persist command output.
- Do not add telemetry, analytics, filesystem scanning, child-process installers, package-manager
  execution, or automatic downloads. `extension.ts` must not import `node:child_process`,
  `node:fs`, `node:os`, or `node:path` — a metadata test asserts this.
- Use official GitHub documentation for Copilot CLI installation guidance. Do not bundle GitHub or
  Microsoft trademarks or artwork without permission.
- Update tests, `README.md`, and `CHANGELOG.md` whenever user-visible behavior changes.

## Compatibility Rules

- No breaking changes without an explicit, authorized major-version decision. Setting IDs
  (`copilotCliLauncher.cliCommand`, `copilotCliLauncher.terminalName`), command IDs
  (`copilotCliLauncher.openCli`, `copilotCliLauncher.openSettings`), the publisher `mikesoft`, and
  the extension name `vscode-copilot-cli-launcher` are part of the public contract.
- Raise `engines.vscode` only when a newly used API actually requires it, and align
  `@types/vscode` in the same change.
- The extension supports Windows, macOS, and Linux. Keep path and quoting handling
  platform-neutral and covered by tests.

## Assets

`media/icon.png` is the product artwork and must not be redesigned, recolored, renamed, or moved.
It may only be losslessly recompressed, preserving dimensions, format, and appearance. A metadata
test requires it to stay at least 256x256 and under 256 KiB.

## Environment Variables and Secrets

The extension itself reads no environment variables and stores no secrets. Publishing tokens
(`VSCE_PAT` for the Visual Studio Marketplace, `OVSX_PAT` for Open VSX) exist only as CI secrets or
an operator's local environment. Never place them in files, command arguments, logs, pull requests,
or shell history, and never echo their values — check only for presence.

## GitHub and CI

- `main` is protected: required status checks `check (ubuntu-latest)` and `check (windows-latest)`,
  one approving review, linear history, and required conversation resolution. Work on a dedicated
  branch and open a pull request; never force-push, rewrite history, or bypass protection.
- Keep workflow permissions minimal and pin third-party actions to immutable commit SHAs.
- Do not weaken branch protection, required checks, review requirements, secret scanning, or push
  protection.
- Do not commit, push, tag, create a release, or publish to a registry unless the user explicitly
  requests that action.

## Versioning and Releases

Semantic versioning. Keep the version synchronized across `package.json`, `package-lock.json`
(both the root and `packages[""]` entries, via `npm version --no-git-tag-version`), `CITATION.cff`,
the version assertion in `test/metadata.test.js`, the default `tag` input of
`.github/workflows/publish-open-vsx.yml`, and `CHANGELOG.md` (Keep a Changelog format, with the
comparison links at the bottom).

Follow [`docs/RELEASING.md`](docs/RELEASING.md), wait for required CI checks, and verify every
target registry after publication:

- Visual Studio Marketplace: `mikesoft.vscode-copilot-cli-launcher`, published with `vsce`.
- Open VSX: `mikesoft/vscode-copilot-cli-launcher`, published by the **Publish Open VSX** workflow
  from an existing GitHub Release asset, or with `ovsx` as an authorized local fallback.

## Mandatory Validation Before Handoff

1. `npm ci --strict-allow-scripts` succeeds from the committed lockfile.
2. `npm run check` passes end to end (compile, unit, metadata, integration, `vsce ls`).
3. `npm run audit` reports no high-severity advisories.
4. `npm run package` produces a VSIX whose file list contains only `out/*.js`, `media/icon.png`,
   `package.json`, and the root documentation and licence files — no sources, tests, maps,
   lockfile, or local tooling.
5. Version references are synchronized and `CHANGELOG.md` has a dated entry with real changes only.
6. `npm ci --strict-allow-scripts` emits no pending `allowScripts` warning; any newly requested
   install script is reviewed and pinned to its exact package version before approval.

## Instructions for AI Agents

- Read this file, `README.md`, `CONTRIBUTING.md`, and `docs/RELEASING.md` before changing anything.
- Prefer small, reviewable diffs. Do not perform cosmetic refactors that enlarge the diff without
  a concrete benefit.
- Never invent changelog entries, badges, statistics, links, or release results. Verify every
  command and URL you document.
- Never delete user data, local `.vsce/` artwork sources, or untracked local files.
- Report failures with their real output instead of working around checks.
