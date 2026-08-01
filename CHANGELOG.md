# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [0.2.10] - 2026-08-01

### Fixed

- Stopped registering every launch's shell-integration listener, fallback timer, and shell-execution listener on the extension context, which VS Code releases only at deactivate. Repeated toolbar clicks appended entries that were never removed and kept each launch's captured terminal output reachable for the rest of the session; launch-scoped disposables now deregister themselves as soon as they are disposed.
- Closing the launcher terminal before its command is sent now cancels that launch's pending shell-integration wait, fallback timer, and missing-command listener instead of leaving them to fire against a terminal that no longer exists.

### Changed

- Extracted the launch disposable registry into `command-utils.ts` as a pure, unit-tested helper and named the shell-integration fallback delay constant.
- Documented the packaging, publishing, validation, and asset rules for the repository in `AGENTS.md`.

### Added

- Unit tests covering the disposable registry and a metadata regression test asserting that per-launch listeners stay out of the never-drained extension subscriptions array.

## [0.2.9] - 2026-08-01

### Changed

- Bounded captured terminal output to the most recent 64 KiB so long-running Copilot CLI sessions cannot grow the extension host's diagnostic buffer indefinitely.
- Made the Windows bare-command bootstrapper warning case-insensitive to match Windows command resolution.
- Compilations now clean `out/` first, preventing stale JavaScript from entering a VSIX package.
- Reused the optimized Marketplace PNG for the toolbar command and removed a 5.24 MB raster-heavy SVG duplicate, reducing the packaged VSIX by roughly 96% without changing the artwork.
- Hardened CI with immutable action revisions, least-privilege checkout credentials, concurrency cancellation, timeouts, and dependency auditing.
- Corrected contributor, support, security, and engineering documentation.

### Security

- Updated the lockfile to resolve the high-severity `brace-expansion` development-tooling advisory.
- Removed the obsolete writable Dependabot auto-merge workflow after version updates were disabled; security updates remain subject to normal review and branch protection.

## [0.2.8]

### Added

- Detection for GitHub Copilot Chat's `copilot`/`copilot.bat`/`copilot.ps1` bootstrapper script, which can hang instead of exiting when launched as a terminal child process and leave an orphaned, CPU-consuming `powershell.exe` process on Windows.
- A blocking confirmation before every launch that would run the bootstrapper: either because `copilotCliLauncher.cliCommand` explicitly points at it, or because the plain default `copilot` command is used on Windows, where `PATH` order this extension cannot see may route it there. Only an explicit "Launch Anyway" proceeds; dismissing the prompt any other way blocks that launch and prompts again next time.
- A new "Known Issue: GitHub Copilot Chat Bootstrapper Hang" section in the README with mitigation steps.

### Changed

- None of the new detection reads the filesystem or resolves PATH; it is a text-only check against the configured command, consistent with the extension's existing no-child-process, no-filesystem-access design.

## [0.2.7]

### Changed

- Replaced automatic and guided npm installation with a link to GitHub's official Copilot CLI installation documentation when the CLI is not found.
- Removed the `copilotCliLauncher.autoInstall` setting and obsolete installer utilities.

### Security

- Removed temporary installer script generation and all child-process and shell-based installer execution.

## [0.2.6]

### Changed

- Improved legal documentation, trademark notices, third-party terms references, and metadata cleanup.

## [0.2.5]

### Changed

- Upgraded TypeScript from `^5.0.0` to `^7.0.0` (resolved 7.0.2). No source or configuration changes were required.
- Raised the minimum required VS Code version to `^1.103.0` and aligned `@types/vscode` to match, so `vsce` validation passes against the declared engine floor.

### Security

- Resolved npm security vulnerabilities via `npm audit fix`.

## [0.2.4]

### Added

- Added `CONTRIBUTING.md`, `SECURITY.md`, and `TRADEMARKS.md` governance documents for the public repository.
- Added `test:unit` and `test:install-utils` npm scripts to match the rest of the launcher family.

### Changed

- Raised the minimum required VS Code version to `^1.93.0`, the actual floor for the terminal shell integration APIs the launcher uses (previously declared `^1.86.0`).
- Compiled against the `ES2022` target to align with the rest of the launcher family.

## [0.2.3]

### Changed

- Unified the `LICENSE` copyright holder to **Michael Gasperini (Mikesoft)** and corrected the copyright year to 2026. No functional changes.

## [0.2.2]

### Changed

- Marketplace discoverability: added the **AI** and **Chat** categories, a more descriptive title and summary, and reordered keywords.
- Added Marketplace, Open VSX, and GitHub Sponsors badges, a `sponsor` link, and a pointer to **Super CLI** (the all-in-one launcher) to the README. No functional changes.

## [0.2.1]

### Changed

- Restored the original Marketplace and toolbar artwork after the 0.2.0 guided install update.
- Rebuilt the VSIX package with the restored bundled visual assets.

## [0.2.0]

### Added

- Added a consent-based guided install flow that asks for explicit confirmation before running `npm install -g @github/copilot`.
- Added `copilotCliLauncher.autoInstall` to allow disabling guided installation prompts.
- Added workspace trust metadata and machine/window scoped configuration.

### Changed

- Updated README setup and troubleshooting docs to describe the current guided install flow.

## [0.1.9]

### Changed

- Refreshed the Marketplace icon and editor toolbar launcher mark assets for the extension package.
- Updated documentation to note the packaged visual assets used by the current release.

## [0.1.8]

### Changed

- Clarified documentation around the standalone GitHub Copilot CLI coding agent launched with the `copilot` command.
- Removed stale references to unrelated CLI tooling from README, docs, changelog, package keywords, and tests.

### Fixed

- Made missing-command detection respect the configured executable instead of matching only `copilot` output.
- Avoided suggesting the npm Copilot CLI install command when a different custom executable is configured.
- Updated development dependency lockfile to resolve the moderate `uuid` audit finding inherited through release tooling.

## [0.1.7]

### Fixed

- Removed duplicate command send that caused Copilot CLI to receive a second `copilot` message in the chat after initialization, consuming an extra premium request on every launch. The command is now sent exactly once through shell integration or the fallback path.

## [0.1.6]

### Changed

- Aligned README requirements and installation steps with the npm-based Copilot CLI (`@github/copilot`).
- Simplified troubleshooting section to focus on Copilot CLI install detection.

## [0.1.5]

### Added

- Install detection for Copilot CLI. Shows a guided warning with a one-click option to open a terminal and run `npm install -g @github/copilot`.

### Fixed

- Fixed command not launching on first click when using `copilot` as the default command.

## [0.1.4]

### Changed

- Simplified the extension by removing install detection logic. The command is now sent directly to the terminal on every launch.

## [0.1.3]

### Changed

- Renamed from "GitHub Copilot CLI launcher" to "Copilot CLI Launcher" for trademark safety.
- Changed the default CLI command to `copilot`.
- Changed the default terminal name from "GitHub Copilot CLI" to "Copilot CLI".

## [0.1.2]

### Changed

- Removed the background version check and one-click upgrade flow (Copilot CLI now updates automatically).
- Removed the `copilotCliLauncher.checkForUpdates` setting.

## [0.1.1]

### Changed

- Updated Marketplace icon and toolbar launcher mark assets.

## [0.1.0]

### Added

- Initial release.
- Toolbar button to launch Copilot CLI in a side terminal.
- Configurable CLI command and terminal name.
- Smart working directory resolution from the active editor.
- Windows, macOS, and Linux support.

[Unreleased]: https://github.com/TheStreamCode/github-copilot-cli-launcher/compare/v0.2.10...HEAD
[0.2.10]: https://github.com/TheStreamCode/github-copilot-cli-launcher/compare/v0.2.9...v0.2.10
[0.2.9]: https://github.com/TheStreamCode/github-copilot-cli-launcher/compare/v0.2.8...v0.2.9
