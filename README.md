# Copilot CLI Launcher

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/mikesoft.vscode-copilot-cli-launcher?label=Marketplace&color=6366F1)](https://marketplace.visualstudio.com/items?itemName=mikesoft.vscode-copilot-cli-launcher)
[![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/mikesoft.vscode-copilot-cli-launcher?color=0EA5E9)](https://marketplace.visualstudio.com/items?itemName=mikesoft.vscode-copilot-cli-launcher)
[![Open VSX](https://img.shields.io/open-vsx/v/mikesoft/vscode-copilot-cli-launcher?label=Open%20VSX&color=a60ee5)](https://open-vsx.org/extension/mikesoft/vscode-copilot-cli-launcher)
[![CI](https://github.com/TheStreamCode/github-copilot-cli-launcher/actions/workflows/ci.yml/badge.svg)](https://github.com/TheStreamCode/github-copilot-cli-launcher/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Sponsor](https://img.shields.io/badge/Sponsor-TheStreamCode-ea4aaa?logo=githubsponsors&logoColor=white)](https://github.com/sponsors/TheStreamCode)

A VS Code extension that opens the standalone GitHub Copilot CLI coding agent in a new side terminal directly from the editor toolbar. One click, fresh terminal, ready to go.

> **Disclaimer**
> This independent extension is unofficial and is not affiliated with, endorsed by, or sponsored by GitHub or Microsoft. See [TRADEMARKS.md](TRADEMARKS.md) for trademark information.

> **✨ Want one launcher for every agent?** Try **[Super CLI](https://marketplace.visualstudio.com/items?itemName=mikesoft.vscode-super-cli)** — a single sidebar that launches Claude Code, Codex, Copilot, Cursor, Grok, Kilo, Antigravity, OpenCode, and more. Install this launcher for Copilot alone, or Super CLI for the whole set.

## Features

- **Toolbar launcher** — one-click button in the editor title area to start Copilot CLI
- **Side-by-side terminal** — opens beside the active editor, never reusing existing terminals
- **Smart working directory** — uses the active editor's workspace folder, with fallback to the first workspace
- **Official installation guidance** — when shell integration detects a missing CLI command, opens GitHub's official installation documentation on request
- **Configurable** — customize the CLI command and terminal label via VS Code settings
- **Marketplace-ready visuals** — refreshed icon and toolbar mark are bundled with the extension package
- **Windows-ready** — supports quoted executable paths with spaces
- **Privacy-first** — no telemetry, analytics, or personal data collection

## Requirements

- VS Code `^1.103.0`
- GitHub Copilot CLI installed and available as `copilot`; see GitHub's [official installation documentation](https://docs.github.com/en/copilot/how-tos/copilot-cli/set-up-copilot-cli/install-copilot-cli)

## Installation

1. **Install the extension** from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=mikesoft.vscode-copilot-cli-launcher).

2. **Install GitHub Copilot CLI** using one of the methods in GitHub's [official installation documentation](https://docs.github.com/en/copilot/how-tos/copilot-cli/set-up-copilot-cli/install-copilot-cli).

3. Open any file in VS Code and click the launcher button in the editor title.

## Missing CLI Guidance

Missing-command guidance depends on terminal shell integration, which lets the extension observe command completion and output. When a configured CLI command is not found, the extension can open GitHub's official Copilot CLI installation documentation in your default browser. The extension does not download software, create installer files, or run installation commands.

Without shell integration, the launcher sends the configured command through its fallback path and cannot detect that the command is missing.

## How It Works

Each launch creates a new terminal beside the current editor and sends the configured command immediately. Existing terminals are never reused.

The launcher uses the workspace folder of the active editor for the terminal's working directory. If the active editor is outside the workspace, it falls back to the first workspace folder. With no workspace folder, the launcher does not set a working directory.

## Workspace Trust and Command Safety

The launcher does not start Copilot CLI until the current workspace is trusted because it runs a terminal command in that workspace. Review workspace trust before launching Copilot CLI in a repository you do not trust.

`copilotCliLauncher.cliCommand` is a machine-scoped setting. The launcher uses only its default or user/machine value and ignores workspace-controlled values, so a workspace cannot set the command it launches.

## Configuration

| Setting | Default | Description |
| --- | --- | --- |
| `copilotCliLauncher.cliCommand` | `copilot` | Machine-scoped command executed when the launcher button is clicked; workspace values are ignored. |
| `copilotCliLauncher.terminalName` | `Copilot CLI` | Base label used for the created terminal. |

Open settings via the Command Palette: **Copilot CLI Launcher: Open Settings**

**Examples:**

Default command:

```json
"copilotCliLauncher.cliCommand": "copilot"
```

Windows executable path with spaces:

```json
"copilotCliLauncher.cliCommand": "\"C:\\Program Files\\GitHub Copilot\\copilot.exe\""
```

## Known Issue: GitHub Copilot Chat Bootstrapper Hang

On Windows, if the GitHub Copilot Chat extension for VS Code is or was ever installed, it can leave a `copilot`/`copilot.bat`/`copilot.ps1` bootstrapper script under its extension global storage (`...\Code\User\globalStorage\github.copilot-chat\copilotCli\`). If that directory appears earlier on your system `PATH` than the real Copilot CLI installation, the plain `copilot` command — this launcher's default — can resolve to that bootstrapper instead of the real binary.

We have observed that bootstrapper hang instead of exiting when launched from a terminal, leaving an orphaned `powershell.exe` process running indefinitely and consuming CPU. Because each launch can leave behind a new stuck process, repeated use compounds the effect on system responsiveness.

This launcher cannot see which binary your shell will actually resolve `copilot` to — it only starts a terminal and sends the configured command, the same as typing it yourself. It therefore cannot silently work around the hang. Instead, it blocks the launch and asks for confirmation:

- If `copilotCliLauncher.cliCommand` is explicitly set to a path inside `github.copilot-chat\copilotCli\`, every launch is blocked until you confirm.
- If you are using the plain default `copilot` command on Windows, the first launch each VS Code session is blocked with a warning; choosing **Launch Anyway** proceeds for the rest of that session. Dismissing the warning any other way (Escape, clicking outside, "Open Settings", "Learn More") blocks that launch and asks again next time, since it does not mean you have accepted the risk.

**Mitigation:** set `copilotCliLauncher.cliCommand` to the full, quoted path of your real Copilot CLI executable (for example the WinGet or npm install location) so it never depends on `PATH` order:

```json
"copilotCliLauncher.cliCommand": "\"C:\\Users\\<you>\\AppData\\Local\\Microsoft\\WinGet\\Packages\\GitHub.Copilot_Microsoft.Winget.Source_8wekyb3d8bbwe\\copilot.exe\""
```

Find your real binary's path with `Get-Command copilot -All` in PowerShell, or `where copilot` — it lists every match on `PATH` in resolution order.

This is not a bug in this launcher, the Copilot CLI binary, or your BYOK/model-switching setup; it is a hang in GitHub's own bootstrapper script when launched as a non-interactive terminal child process. If you can reproduce it outside this launcher, please report it to GitHub through the official [Copilot CLI documentation](https://docs.github.com/en/copilot/how-tos/copilot-cli/set-up-copilot-cli/install-copilot-cli).

## Troubleshooting

### Copilot CLI is not found

Follow GitHub's [official installation documentation](https://docs.github.com/en/copilot/how-tos/copilot-cli/set-up-copilot-cli/install-copilot-cli), then verify that `copilot` is available in a regular terminal.

If your setup relies on shell initialization, restart VS Code after installation so new terminals inherit the updated environment.

### Nothing happens after clicking the button

Check the value of `copilotCliLauncher.cliCommand` in settings and verify that the same command works in a regular terminal.

### Custom executable path on Windows

Quote executable paths that contain spaces, for example: `"C:\Program Files\GitHub Copilot\copilot.exe"`.

### Multi-root workspaces

The launcher uses the workspace folder of the active editor. To control where Copilot CLI starts in a multi-root window, open a file from the target workspace before clicking the toolbar button.

## Privacy

Copilot CLI Launcher does not collect telemetry, analytics, or personal data.

The extension ships its bundled visual assets inside the VSIX package and does not fetch remote images at runtime.

## Development

```bash
npm install
npm run check
npm run test:integration
npm run package
```

`npm run package` creates the `.vsix` file in the workspace root.

The repository includes unit tests, metadata checks, VS Code integration smoke tests, and CI coverage for Windows and Linux.

## Support

Open a [GitHub issue](https://github.com/TheStreamCode/github-copilot-cli-launcher/issues) for bugs and feature requests. For support details, see [SUPPORT.md](SUPPORT.md).

Financial support for the independent maintainer is available through GitHub Sponsors: [github.com/sponsors/TheStreamCode](https://github.com/sponsors/TheStreamCode).

## License

Released under the [MIT License](LICENSE).
