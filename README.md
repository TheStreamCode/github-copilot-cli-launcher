# Copilot CLI Launcher

Launch the standalone GitHub Copilot CLI coding agent from your editor toolbar in a fresh side terminal

[![CI](https://github.com/TheStreamCode/github-copilot-cli-launcher/actions/workflows/ci.yml/badge.svg)](https://github.com/TheStreamCode/github-copilot-cli-launcher/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Visual Studio Marketplace](https://img.shields.io/badge/Marketplace-Copilot%20CLI%20Launcher-007ACC)](https://marketplace.visualstudio.com/items?itemName=mikesoft.vscode-copilot-cli-launcher)

Copilot CLI Launcher is a small, privacy-first, unofficial VS Code extension that starts a user-configured GitHub Copilot CLI command in a fresh side terminal. It uses the active editor's workspace, never reuses terminals, and has no telemetry, installers, filesystem scanning, or background network behavior.

> **Disclaimer.** This independent extension is unofficial and is not affiliated with, endorsed by, or sponsored by GitHub or Microsoft. See [`TRADEMARKS.md`](TRADEMARKS.md) for trademark information.

## Install

Install from the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=mikesoft.vscode-copilot-cli-launcher) or from [Open VSX](https://open-vsx.org/extension/mikesoft/vscode-copilot-cli-launcher). You can also download the latest VSIX from [GitHub releases](https://github.com/TheStreamCode/github-copilot-cli-launcher/releases/latest).

VS Code users can install the Marketplace build from a terminal:

```bash
code --install-extension mikesoft.vscode-copilot-cli-launcher
```

GitHub Copilot CLI itself is a separate product. Install it by following GitHub's [official installation documentation](https://docs.github.com/en/copilot/how-tos/copilot-cli/set-up-copilot-cli/install-copilot-cli) and confirm that `copilot` works in an integrated terminal.

## Quick start

1. Install GitHub Copilot CLI and make sure `copilot` runs in your integrated terminal.
2. Install this extension and open a file in a trusted workspace.
3. Click the launcher button in the editor title toolbar.

Each launch creates a new terminal beside the current editor and sends the configured command exactly once.

## Features

- Toolbar command in the editor title area
- A new side terminal for every launch
- Active-editor workspace resolution with multi-root fallback
- Configurable CLI command and terminal label
- Quoted executable-path support on Windows
- Missing-command guidance through GitHub's official documentation
- Workspace Trust enforcement and machine-scoped command configuration
- No telemetry, analytics, installers, or background services

## Requirements

- VS Code `^1.103.0` or a compatible editor
- A working `copilot` command in the integrated terminal environment, or a working custom launch command in settings

| Environment | Support | Validation |
| --- | --- | --- |
| VS Code `^1.103.0` | Supported | Integration smoke test in CI |
| Windows | Supported | Tested in CI; quoted executable paths are covered |
| Linux | Supported | Tested in CI |
| macOS | Supported | Platform-neutral implementation; not in the CI matrix |
| Cursor and Windsurf | Compatible | Uses the VS Code extension API; not in the CI matrix |

## Configuration

| Setting | Purpose | Default |
| --- | --- | --- |
| `copilotCliLauncher.cliCommand` | Machine-scoped command executed when the launcher button is clicked; workspace values are ignored. | `copilot` |
| `copilotCliLauncher.terminalName` | Base label used for created terminals. | `Copilot CLI` |

Open the settings with **Copilot CLI Launcher: Open Settings** from the Command Palette.

Windows executable path with spaces:

```json
"copilotCliLauncher.cliCommand": "\"C:\\Program Files\\GitHub Copilot\\copilot.exe\""
```

## Privacy and security

The extension does not collect telemetry, analytics, or personal data. It uses the active editor's workspace folder as the terminal working directory, falling back to the first workspace folder when the editor is outside the workspace.

- Workspace Trust: the launcher does not run the command until the current workspace is trusted.
- Command source: `copilotCliLauncher.cliCommand` uses only its default or user/machine value; workspace-controlled values are ignored.
- Terminal output: diagnostic output is bounded, kept in memory, and never persisted.
- Downloads: the extension does not download software, create installer files, or run installation commands.
- Background activity: no filesystem scanning, automatic downloads, background services, or extension-initiated network checks.

The configured command runs inside the selected workspace, so review Workspace Trust before launching Copilot CLI in an unfamiliar repository. The separate Copilot CLI process remains subject to GitHub's own behavior and terms. See [`SECURITY.md`](SECURITY.md) for vulnerability reporting.

## Troubleshooting

On Windows, an older GitHub Copilot Chat bootstrapper can take precedence over the real `copilot` executable and hang. The launcher warns before a potentially affected launch because it cannot inspect your `PATH` without weakening its local-only design. The most reliable mitigation is to set `copilotCliLauncher.cliCommand` to the full, quoted path of the real executable. Use `Get-Command copilot -All` in PowerShell or `where copilot` to inspect command resolution.

### The terminal opens but `copilot` is not found

Follow GitHub's [official installation documentation](https://docs.github.com/en/copilot/how-tos/copilot-cli/set-up-copilot-cli/install-copilot-cli), then verify the command in a regular terminal and restart VS Code so new terminals inherit the updated environment.

### Nothing happens after clicking the button

Confirm that the workspace is trusted, check `copilotCliLauncher.cliCommand`, and verify that the same command works in a regular terminal. If the path contains spaces, quote the executable path.

### Multi-root workspaces

The launcher uses the workspace folder containing the active editor. To select a starting folder in a multi-root window, open a file from the target workspace before clicking the launcher button.

For symptoms, mitigation examples, missing-command help, and multi-root behavior, see the [complete troubleshooting guide](docs/TROUBLESHOOTING.md).

## Development

Requirements: Node.js 22, npm 11.16.0, and the committed `package-lock.json`. npm install scripts are allowed only when their exact package version appears in `allowScripts`.

```bash
git clone https://github.com/TheStreamCode/github-copilot-cli-launcher.git
cd github-copilot-cli-launcher
npm ci --strict-allow-scripts
npm run check
npm run audit
```

`npm run check` performs a clean compile, unit and metadata tests, a VS Code integration smoke test, and package-content validation. `npm run package` creates the `.vsix` release candidate. See [`docs/RELEASING.md`](docs/RELEASING.md) for the maintainer checklist.

## Support

Open a [GitHub issue](https://github.com/TheStreamCode/github-copilot-cli-launcher/issues) for bugs and feature requests, or read [`SUPPORT.md`](SUPPORT.md) for reporting guidance and contact options. Maintenance can be supported through [GitHub Sponsors](https://github.com/sponsors/TheStreamCode).

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md). Pull requests must pass the required CI checks.

## License

MIT License — see [`LICENSE`](LICENSE).

---

Maintained by [Michael Gasperini (Mikesoft)](https://mikesoft.it).
If this project is useful to you, consider [sponsoring its maintenance](https://github.com/sponsors/TheStreamCode).
