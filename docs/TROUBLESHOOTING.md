# Troubleshooting

This guide covers launcher-specific diagnostics. For installing or troubleshooting GitHub Copilot CLI itself, start with GitHub's [official installation documentation](https://docs.github.com/en/copilot/how-tos/copilot-cli/set-up-copilot-cli/install-copilot-cli).

## GitHub Copilot Chat Bootstrapper Hang on Windows

### Symptoms

If the GitHub Copilot Chat extension for VS Code is or was installed, it can leave a `copilot`, `copilot.bat`, or `copilot.ps1` bootstrapper under its extension global storage directory:

```text
...\Code\User\globalStorage\github.copilot-chat\copilotCli\
```

If that directory appears earlier on `PATH` than the real Copilot CLI installation, the plain `copilot` command can resolve to the bootstrapper instead of the actual executable. The bootstrapper may hang in a terminal and leave an orphaned `powershell.exe` process consuming CPU. Repeated launches can leave multiple stuck processes.

You can reproduce the resolution outside this extension by running the same command in a regular terminal.

### Why the Launcher Warns

Copilot CLI Launcher starts a terminal and sends the configured command, just as a user would type it. It deliberately does not scan the filesystem or resolve `PATH`, so it cannot silently choose a different binary.

- An explicit command path inside `github.copilot-chat\copilotCli\` requires confirmation on every launch.
- The plain `copilot` command on Windows requires confirmation on the first launch of each VS Code session.
- Only **Launch Anyway** accepts the risk. Dismissing the prompt or choosing another action blocks that launch.

### Recommended Mitigation

Find every matching command in resolution order:

```powershell
Get-Command copilot -All
where copilot
```

Then set `copilotCliLauncher.cliCommand` to the full, quoted path of the real Copilot CLI executable. For example:

```json
"copilotCliLauncher.cliCommand": "\"C:\\Users\\<you>\\AppData\\Local\\Microsoft\\WinGet\\Packages\\GitHub.Copilot_Microsoft.Winget.Source_8wekyb3d8bbwe\\copilot.exe\""
```

The exact location depends on how Copilot CLI was installed. Verify the path on your machine instead of copying the example unchanged.

If the same hang occurs when you run the resolved bootstrapper directly in a regular terminal, report it to GitHub through the official Copilot CLI documentation. The launcher does not modify or replace GitHub's bootstrapper.

## Copilot CLI Is Not Found

Follow GitHub's [official installation documentation](https://docs.github.com/en/copilot/how-tos/copilot-cli/set-up-copilot-cli/install-copilot-cli), then verify the command in a regular terminal:

```powershell
copilot --version
```

Restart VS Code after installing the CLI so newly created terminals inherit the updated environment.

Missing-command guidance depends on VS Code terminal shell integration. When integration is unavailable, the launcher can send the command but cannot observe its completion or determine that it is missing. The extension does not download software, create installer files, or run installation commands.

## Nothing Happens After Clicking the Button

1. Confirm the workspace is trusted.
2. Open **Copilot CLI Launcher: Open Settings** from the Command Palette.
3. Verify that `copilotCliLauncher.cliCommand` works in a regular terminal.
4. If the path contains spaces, quote the executable path in the setting.

## Custom Executable Paths on Windows

Use escaped double quotes around executable paths that contain spaces:

```json
"copilotCliLauncher.cliCommand": "\"C:\\Program Files\\GitHub Copilot\\copilot.exe\""
```

The setting is machine-scoped. Workspace configuration cannot replace the command that is launched.

## Multi-root Workspaces

The launcher uses the workspace folder containing the active editor. To select a starting folder in a multi-root window, open a file from the target workspace before clicking the launcher button.

If the active editor is outside every workspace folder, the launcher uses the first workspace folder. If no workspace is open, it leaves the terminal working directory unset.

## Reporting a Launcher Issue

If the configured command works in a regular VS Code terminal but not through the launcher, open a [GitHub issue](https://github.com/TheStreamCode/github-copilot-cli-launcher/issues) and include the non-sensitive diagnostics listed in [SUPPORT.md](../SUPPORT.md). Never include credentials, tokens, customer data, or private repository content.
