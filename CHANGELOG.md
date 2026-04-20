# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.1.5]

### Added

- Install detection for Copilot CLI. Shows a guided warning with a one-click option to open a terminal and run `npm install -g @github/copilot`.

### Fixed

- Fixed command not launching on first click when using `copilot` as the default command. The previous install detection logic was gated on the command starting with `gh`, which prevented the command from being sent to the terminal.

## [0.1.4]

### Changed

- Simplified the extension by removing install detection logic. The command is now sent directly to the terminal on every launch.

## [0.1.3]

### Changed

- Renamed from "GitHub Copilot CLI launcher" to "Copilot CLI Launcher" for trademark safety.
- Changed the default CLI command from `gh copilot` to `copilot`.
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
