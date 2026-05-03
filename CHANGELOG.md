# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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
