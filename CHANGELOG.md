# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.1.2]

### Changed

- Renamed from "GitHub Copilot CLI launcher" to "Copilot CLI Launcher".
- Changed the default CLI command from `gh copilot` to `copilot`.
- Changed the default terminal name from "GitHub Copilot CLI" to "Copilot CLI".
- Removed the background version check and one-click upgrade flow (Copilot CLI now updates automatically).
- Removed the `copilotCliLauncher.checkForUpdates` setting.

## [0.1.1]

### Changed

- Updated Marketplace icon and toolbar launcher mark assets.

## [0.1.0]

### Added

- Initial release.
- Toolbar button to launch Copilot CLI in a side terminal.
- Install detection for `gh` CLI and the `gh-copilot` extension with guided warnings.
- Configurable CLI command and terminal name.
- Smart working directory resolution from the active editor.
- Windows, macOS, and Linux support.