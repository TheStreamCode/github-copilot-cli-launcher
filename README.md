# Copilot CLI Launcher

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/mikesoft.vscode-copilot-cli-launcher?label=Marketplace&color=6366F1)](https://marketplace.visualstudio.com/items?itemName=mikesoft.vscode-copilot-cli-launcher)
[![Open VSX](https://img.shields.io/open-vsx/v/mikesoft/vscode-copilot-cli-launcher?label=Open%20VSX&color=a60ee5)](https://open-vsx.org/extension/mikesoft/vscode-copilot-cli-launcher)
[![CI](https://github.com/TheStreamCode/github-copilot-cli-launcher/actions/workflows/ci.yml/badge.svg)](https://github.com/TheStreamCode/github-copilot-cli-launcher/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Launch the standalone GitHub Copilot CLI coding agent from your editor toolbar in a fresh side terminal. No terminal reuse, telemetry, installers, or background services.

[Install from Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=mikesoft.vscode-copilot-cli-launcher) · [Install from Open VSX](https://open-vsx.org/extension/mikesoft/vscode-copilot-cli-launcher) · [Download the latest VSIX](https://github.com/TheStreamCode/github-copilot-cli-launcher/releases/latest)

> **Disclaimer**
> This independent extension is unofficial and is not affiliated with, endorsed by, or sponsored by GitHub or Microsoft. See [TRADEMARKS.md](TRADEMARKS.md) for trademark information.

## Why Copilot CLI Launcher

- **One click, one fresh terminal** — launch Copilot CLI beside the active editor without replacing or reusing an existing terminal.
- **The right working directory** — start in the active editor's workspace folder, with a predictable fallback for multi-root projects.
- **Local and focused** — no telemetry, analytics, installers, filesystem scanning, or background network behavior.

## Quick Start

1. Install the extension from the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=mikesoft.vscode-copilot-cli-launcher) or [Open VSX](https://open-vsx.org/extension/mikesoft/vscode-copilot-cli-launcher).
2. Install GitHub Copilot CLI by following GitHub's [official installation documentation](https://docs.github.com/en/copilot/how-tos/copilot-cli/set-up-copilot-cli/install-copilot-cli).
3. Open a file in a trusted workspace and click the launcher button in the editor title.

Requires VS Code `^1.103.0` or a compatible editor and a working `copilot` command.

## Features

- Toolbar command in the editor title area
- A new side terminal for every launch
- Active-editor workspace resolution with multi-root fallback
- Configurable CLI command and terminal label
- Quoted executable-path support on Windows
- Missing-command guidance through official GitHub documentation
- Workspace Trust enforcement and machine-scoped command configuration

## Compatibility

| Environment | Support | Validation |
| --- | --- | --- |
| VS Code `^1.103.0` | Supported | Integration smoke test in CI |
| Windows | Supported | Tested in CI; quoted executable paths are covered |
| Linux | Supported | Tested in CI |
| macOS | Supported | Platform-neutral implementation; not in the CI matrix |
| Cursor and Windsurf | Compatible | Uses the VS Code extension API; not in the CI matrix |

## How It Works

Each launch creates a new terminal beside the current editor and sends the configured command exactly once. Existing terminals are never reused.

The launcher uses the active editor's workspace folder as the terminal's working directory. If the active editor is outside the workspace, it falls back to the first workspace folder. With no workspace folder, it leaves the working directory unset.

## Security and Privacy

| Area | Behavior |
| --- | --- |
| Workspace Trust | The launcher will not run the command until the current workspace is trusted. |
| Command source | `copilotCliLauncher.cliCommand` uses only its default or user/machine value; workspace-controlled values are ignored. |
| Terminal output | Diagnostic output is bounded, kept in memory, and never persisted. |
| Data collection | Copilot CLI Launcher does not collect telemetry, analytics, or personal data. |
| Downloads and installation | The extension does not download software, create installer files, or run installation commands. |
| Background activity | No filesystem scanning, automatic downloads, background services, or extension-initiated network checks. |

The configured command runs inside the selected workspace, so review Workspace Trust before launching Copilot CLI in an unfamiliar repository. The separate Copilot CLI process remains subject to GitHub's own behavior and terms.

## Configuration

| Setting | Default | Description |
| --- | --- | --- |
| `copilotCliLauncher.cliCommand` | `copilot` | Machine-scoped command executed when the launcher button is clicked; workspace values are ignored. |
| `copilotCliLauncher.terminalName` | `Copilot CLI` | Base label used for the created terminal. |

Open settings from the Command Palette with **Copilot CLI Launcher: Open Settings**.

Default command:

```json
"copilotCliLauncher.cliCommand": "copilot"
```

Windows executable path with spaces:

```json
"copilotCliLauncher.cliCommand": "\"C:\\Program Files\\GitHub Copilot\\copilot.exe\""
```

## Missing CLI Guidance

When terminal shell integration is available, the extension can detect a missing configured command and offer to open GitHub's official installation documentation. Without shell integration, it sends the command through its fallback path and cannot determine whether the command exists.

## Troubleshooting

On Windows, an older GitHub Copilot Chat bootstrapper can sometimes take precedence over the real `copilot` executable and hang. The launcher warns before a potentially affected launch because it cannot inspect your `PATH` without weakening its local-only design.

The most reliable mitigation is to set `copilotCliLauncher.cliCommand` to the full, quoted path of the real executable. Use `Get-Command copilot -All` in PowerShell or `where copilot` to inspect command resolution.

For symptoms, mitigation examples, missing-command help, and multi-root behavior, see the [complete troubleshooting guide](docs/TROUBLESHOOTING.md).

## Development

```bash
npm ci --strict-allow-scripts
npm run check
npm run audit
npm run package
```

`npm run check` performs a clean compile, unit and metadata tests, a VS Code integration smoke test, and package-content validation. CI repeats the gate on Windows and Linux and rejects high-severity dependency advisories. `npm run package` creates the `.vsix` release candidate.

## Related Project

Need one launcher for several coding agents? [Super CLI](https://marketplace.visualstudio.com/items?itemName=mikesoft.vscode-super-cli) provides a unified sidebar for Copilot, Claude Code, Codex, Cursor, Grok, Kilo, Antigravity, OpenCode, and more.

## Support

Open a [GitHub issue](https://github.com/TheStreamCode/github-copilot-cli-launcher/issues) for bugs and feature requests. See [SUPPORT.md](SUPPORT.md) for reporting guidance and contact options.

You can support the independent maintainer through [GitHub Sponsors](https://github.com/sponsors/TheStreamCode).

## License

This project is licensed under the [MIT License](LICENSE).
