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
- **Guided installation** — when shell integration detects that the default `copilot` command is missing, can offer a consent-based install flow
- **Configurable** — customize the CLI command and terminal label via VS Code settings
- **Marketplace-ready visuals** — refreshed icon and toolbar mark are bundled with the extension package
- **Windows-ready** — supports quoted executable paths with spaces
- **Privacy-first** — no telemetry, analytics, or personal data collection

## Requirements

- VS Code `^1.103.0`
- GitHub Copilot CLI installed and available as `copilot` (`npm install -g @github/copilot`)

## Installation

1. **Install the extension** from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=mikesoft.vscode-copilot-cli-launcher).

2. **Install GitHub Copilot CLI:**

   ```bash
   npm install -g @github/copilot
   ```

3. Open any file in VS Code and click the launcher button in the editor title.

## Guided Installation

Missing-command guidance depends on terminal shell integration, which lets the extension observe command completion and output. Without shell integration, the launcher sends the command through its fallback path and does not show missing-command guidance.

When shell integration detects that the configured command resolving to the default `copilot` executable is missing and `copilotCliLauncher.autoInstall` is enabled, the extension offers to install GitHub Copilot CLI, open the GitHub documentation, or open the extension settings. For a custom executable, it offers settings instead; with `autoInstall` disabled, it offers settings and documentation without starting an installer.

Choosing **Install** opens a visible terminal and runs a generated prompt script. Installation only starts after explicit confirmation:

```text
GitHub Copilot CLI was not found.
Install GitHub Copilot CLI now? (y/N):
```

Answer `y` or `yes` to run:

```bash
npm install -g @github/copilot
```

Any other answer cancels installation.

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
| `copilotCliLauncher.autoInstall` | `true` | Offer guided installation when shell integration detects that the default `copilot` command is missing. |

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

## Troubleshooting

### Copilot CLI is not found

Install Copilot CLI globally with npm:

```bash
npm install -g @github/copilot
```

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
