# GitHub Copilot CLI launcher

[![CI](https://github.com/TheStreamCode/github-copilot-cli-launcher/actions/workflows/ci.yml/badge.svg)](https://github.com/TheStreamCode/github-copilot-cli-launcher/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A VS Code extension that opens GitHub Copilot CLI in a new side terminal directly from the editor toolbar. One click, fresh terminal, ready to go.

Works on Windows, macOS, and Linux.

> **Disclaimer**
> This extension is unofficial and is not affiliated with, endorsed by, or sponsored by GitHub or Microsoft. "GitHub Copilot" is a trademark of GitHub, Inc.

## Features

- **Toolbar launcher** — one-click button in the editor title area to start Copilot CLI
- **Side-by-side terminal** — opens beside the active editor, never reusing existing terminals
- **Smart working directory** — uses the active editor's workspace folder, with fallback to the first workspace
- **Install detection** — shows guided warnings when `gh` or the `gh-copilot` extension is missing
- **Configurable** — customize the CLI command and terminal label via VS Code settings
- **Windows-ready** — supports quoted executable paths with spaces
- **Privacy-first** — no telemetry, analytics, or personal data collection

## Requirements

- VS Code `^1.86.0`
- [GitHub CLI (`gh`)](https://cli.github.com/) available in the integrated terminal
- `gh-copilot` extension installed (`gh extension install github/gh-copilot`)

## Installation

1. **Install the extension** from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=mikesoft.vscode-copilot-cli-launcher).

2. **Install GitHub CLI:**

   ```bash
   # macOS
   brew install gh

   # Windows (winget)
   winget install --id GitHub.cli

   # Linux — see https://cli.github.com/ for your distribution
   ```

3. **Install the Copilot CLI extension:**

   ```bash
   gh extension install github/gh-copilot
   ```

4. Open any file in VS Code and click the launcher button in the editor title.

## How It Works

Each launch creates a new terminal beside the current editor and sends the configured command immediately. Existing terminals are never reused.

The launcher prefers the workspace folder of the active editor for the terminal's working directory. If the active editor is outside the workspace, it falls back to the first workspace folder.

When the terminal runs, the extension checks command availability and surfaces guided warnings if `gh` or the `gh-copilot` extension is missing — making problems easier to understand than relying on terminal output alone.

## Configuration

| Setting | Default | Description |
| --- | --- | --- |
| `copilotCliLauncher.cliCommand` | `copilot` | Command executed when the launcher button is clicked. |
| `copilotCliLauncher.terminalName` | `GitHub Copilot CLI` | Base label used for the created terminal. |

Open settings via the Command Palette: **GitHub Copilot CLI launcher: Open Settings**

**Examples:**

Default command:

```json
"copilotCliLauncher.cliCommand": "copilot"
```

Windows executable path with spaces:

```json
"copilotCliLauncher.cliCommand": "\"C:\\Program Files\\GitHub CLI\\gh.exe\" copilot"
```

## Troubleshooting

### `gh` is not recognized

Install the GitHub CLI from [https://cli.github.com/](https://cli.github.com/) and confirm that `gh` works in a regular integrated terminal. If your setup relies on shell initialization, restart VS Code after installation so new terminals inherit the updated environment.

The extension also shows a VS Code warning dialog to make the issue clearer.

### The gh-copilot extension is not installed

Install it with:

```bash
gh extension install github/gh-copilot
```

### Nothing happens after clicking the button

Check the value of `copilotCliLauncher.cliCommand` in settings and verify that the same command works in a regular terminal.

### Custom executable path on Windows

Quote executable paths that contain spaces, for example: `"C:\Program Files\GitHub CLI\gh.exe" copilot`.

### Multi-root workspaces

The launcher uses the workspace folder of the active editor. To control where Copilot CLI starts in a multi-root window, open a file from the target workspace before clicking the toolbar button.

## Privacy

GitHub Copilot CLI launcher does not collect telemetry, analytics, or personal data.

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

## License

Released under the [MIT License](LICENSE).