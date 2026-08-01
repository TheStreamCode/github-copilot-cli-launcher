# Repository Agent Guide

## Scope

These instructions apply to the entire repository.

## Project Overview

Copilot CLI Launcher is a small, privacy-first VS Code extension. It creates a fresh side terminal and starts a user-configured GitHub Copilot CLI command. The extension must remain unofficial, local-only, and free of telemetry, installers, or background network behavior.

## Source Layout

- `src/extension.ts`: VS Code activation, commands, terminal lifecycle, prompts, and shell-integration wiring.
- `src/command-utils.ts`: pure command parsing, risk classification, output bounding, naming, and workspace resolution helpers.
- `test/`: Node unit and metadata tests plus the VS Code integration smoke test.
- `media/`: packaged product artwork.
- `.github/`: issue templates, pull request guidance, and CI.

## Required Commands

Use Node.js 22 and install the committed dependency graph:

```powershell
npm ci
npm run check
npm run audit
```

Build a release candidate only after those commands pass:

```powershell
npm run package -- --out .vsce/review.vsix
```

Do not commit `node_modules/`, `out/`, `.vscode-test/`, `.vsce/`, logs, or generated `.vsix` files.

## Engineering Guardrails

- Keep TypeScript strict and move reusable decision logic into pure functions in `command-utils.ts` with focused tests.
- Preserve Workspace Trust checks and resolve `copilotCliLauncher.cliCommand` from user or machine configuration only. A workspace must not be able to choose the command that is executed.
- Send the configured command exactly once. Shell-integration and fallback paths must remain mutually exclusive.
- Keep captured terminal output bounded and in memory only; never persist command output.
- Do not add telemetry, analytics, filesystem scanning, child-process installers, package-manager execution, or automatic downloads.
- Use official GitHub documentation for Copilot CLI installation guidance. Do not bundle GitHub or Microsoft trademarks or artwork without permission.
- Update tests, `README.md`, and `CHANGELOG.md` whenever user-visible behavior changes.

## GitHub and CI

- Keep workflow permissions minimal and pin third-party actions to immutable commit SHAs.
- Do not weaken `main` branch protection, required checks, review requirements, secret scanning, or push protection.
- Never place publishing tokens in files, commands, logs, pull requests, or shell history. Use environment variables supplied through an approved secret store.
- Do not commit, push, tag, create a release, or publish to a registry unless the user explicitly requests that action.

## Releases

Keep the version synchronized in `package.json`, `package-lock.json`, `CITATION.cff`, tests, and `CHANGELOG.md`. Follow [`docs/RELEASING.md`](docs/RELEASING.md), wait for required CI checks, and verify every target registry after publication.
