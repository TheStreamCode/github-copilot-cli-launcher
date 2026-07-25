import * as vscode from 'vscode';
import {
  FALLBACK_TERMINAL_NAME,
  buildExtensionSettingsQuery,
  buildTerminalName,
  isDefaultBareCopilotCommand,
  isGitHubCopilotChatBootstrapper,
  normalizeTerminalName,
  resolveCliCommandSetting,
  resolveTerminalCwd,
  shouldShowMissingCliGuidance,
} from './command-utils.js';

const SETTINGS_NAMESPACE = 'copilotCliLauncher';
const COPILOT_DOCS_URL = 'https://docs.github.com/en/copilot/how-tos/copilot-cli/set-up-copilot-cli/install-copilot-cli';
const BOOTSTRAPPER_HANG_DOCS_URL = 'https://github.com/TheStreamCode/github-copilot-cli-launcher#known-issue-github-copilot-chat-bootstrapper-hang';

let terminalSequence = 1;
let hasShownBootstrapperAdvisory = false;

function collectShellExecutionOutput(execution: vscode.TerminalShellExecution): Promise<string> {
  return (async () => {
    let output = '';

    try {
      for await (const chunk of execution.read()) {
        output += chunk;
      }
    } catch {
      return output;
    }

    return output;
  })();
}

async function openExtensionSettings(context: vscode.ExtensionContext): Promise<void> {
  await vscode.commands.executeCommand('workbench.action.openSettings', buildExtensionSettingsQuery(context.extension.id));
}

async function openCopilotInstallInstructions(): Promise<void> {
  await vscode.env.openExternal(vscode.Uri.parse(COPILOT_DOCS_URL));
}

function executeCommandWithOptionalShellIntegration(
  terminal: vscode.Terminal,
  command: string,
  context: vscode.ExtensionContext,
  onShellExecutionEnd?: (event: vscode.TerminalShellExecutionEndEvent, output: string) => void | Promise<void>,
): void {
  let executionStarted = false;

  const startExecution = (shellIntegration: vscode.TerminalShellIntegration) => {
    if (executionStarted) {
      return;
    }

    executionStarted = true;
    shellIntegrationListener.dispose();
    clearTimeout(fallbackHandle);

    let execution: vscode.TerminalShellExecution | undefined;
    let outputPromise: Promise<string> | undefined;

    const executionListener = onShellExecutionEnd
      ? vscode.window.onDidEndTerminalShellExecution(async (endEvent) => {
        if (endEvent.terminal !== terminal || (execution && endEvent.execution !== execution)) {
          return;
        }

        executionListener?.dispose();
        const output = outputPromise ? await outputPromise : '';
        await onShellExecutionEnd(endEvent, output);
      })
      : undefined;

    if (executionListener) {
      context.subscriptions.push(executionListener);
    }

    execution = shellIntegration.executeCommand(command);
    outputPromise = collectShellExecutionOutput(execution);
  };

  const shellIntegrationListener = vscode.window.onDidChangeTerminalShellIntegration((event) => {
    if (event.terminal !== terminal) {
      return;
    }

    startExecution(event.shellIntegration);
  });

  const fallbackHandle = setTimeout(() => {
    if (terminal.shellIntegration) {
      startExecution(terminal.shellIntegration);
      return;
    }

    executionStarted = true;
    shellIntegrationListener.dispose();
    terminal.sendText(command, true);
  }, 3000);

  if (terminal.shellIntegration) {
    startExecution(terminal.shellIntegration);
    return;
  }

  context.subscriptions.push(
    shellIntegrationListener,
    { dispose: () => clearTimeout(fallbackHandle) },
  );
}

async function handleMissingCopilot(cliCommand: string): Promise<void> {
  const selection = await vscode.window.showWarningMessage(
    `The configured GitHub Copilot CLI command could not be started: ${cliCommand}.`,
    'Open GitHub Docs',
  );

  if (selection === 'Open GitHub Docs') {
    await openCopilotInstallInstructions();
  }
}

/**
 * Returns `true` when it is safe to proceed with launching `cliCommand`. Returns `false` when
 * `cliCommand` explicitly points at GitHub's Copilot Chat bootstrapper
 * (`copilot`/`copilot.bat`/`copilot.ps1` under the `github.copilot-chat` extension's global
 * storage) instead of the real Copilot CLI binary, unless the user explicitly chooses to launch
 * it anyway. That bootstrapper can hang after launch instead of exiting, leaving an orphaned,
 * CPU-consuming `powershell.exe` process behind on Windows.
 */
async function confirmBootstrapperLaunch(cliCommand: string, context: vscode.ExtensionContext): Promise<boolean> {
  if (!isGitHubCopilotChatBootstrapper(cliCommand)) {
    return true;
  }

  const selection = await vscode.window.showWarningMessage(
    `"${cliCommand}" points directly at GitHub's Copilot Chat bootstrapper script, which can hang instead of exiting and leave a stuck background process running. Point "copilotCliLauncher.cliCommand" at the real Copilot CLI executable to avoid this.`,
    'Launch Anyway',
    'Open Settings',
    'Learn More',
  );

  if (selection === 'Launch Anyway') {
    return true;
  }

  if (selection === 'Open Settings') {
    await openExtensionSettings(context);
  } else if (selection === 'Learn More') {
    await vscode.env.openExternal(vscode.Uri.parse(BOOTSTRAPPER_HANG_DOCS_URL));
  }

  return false;
}

/**
 * Shows a one-time, non-blocking advisory (per VS Code session) when launching the unmodified
 * default `copilot` command on Windows. That bare command relies on PATH resolution outside this
 * extension's control; if another PATH entry (for example the `github.copilot-chat` extension's
 * bootstrapper directory) resolves first, the terminal can end up running the known-hanging
 * bootstrapper instead of the real CLI. This extension does not read the filesystem or PATH, so
 * it cannot confirm which binary will actually run — the advisory only names the risk and links
 * to mitigation steps.
 */
async function maybeShowBootstrapperAdvisory(cliCommand: string, context: vscode.ExtensionContext): Promise<void> {
  if (hasShownBootstrapperAdvisory || process.platform !== 'win32' || !isDefaultBareCopilotCommand(cliCommand)) {
    return;
  }

  hasShownBootstrapperAdvisory = true;

  const selection = await vscode.window.showInformationMessage(
    'Heads up: if GitHub Copilot Chat is installed in VS Code, its bootstrapper script can shadow the plain "copilot" command on PATH and hang instead of exiting. If Copilot CLI ever seems stuck, set "copilotCliLauncher.cliCommand" to the full path of the real Copilot CLI executable.',
    'Open Settings',
    'Learn More',
    "Don't Show Again",
  );

  if (selection === 'Open Settings') {
    await openExtensionSettings(context);
  } else if (selection === 'Learn More') {
    await vscode.env.openExternal(vscode.Uri.parse(BOOTSTRAPPER_HANG_DOCS_URL));
  }
}

function watchForMissingCopilot(terminal: vscode.Terminal, cliCommand: string, context: vscode.ExtensionContext): void {
  executeCommandWithOptionalShellIntegration(
    terminal,
    cliCommand,
    context,
    async (endEvent, output) => {
      if (shouldShowMissingCliGuidance(cliCommand, endEvent.exitCode, output)) {
        await handleMissingCopilot(cliCommand);
      }
    },
  );
}

export function activate(context: vscode.ExtensionContext): void {
  const openCliCommand = vscode.commands.registerCommand('copilotCliLauncher.openCli', async () => {
    if (!vscode.workspace.isTrusted) {
      const selection = await vscode.window.showWarningMessage(
        'Copilot CLI Launcher runs terminal commands in the current workspace. Trust this workspace before launching Copilot CLI.',
        'Manage Workspace Trust',
        'Open Settings',
      );

      if (selection === 'Manage Workspace Trust') {
        await vscode.commands.executeCommand('workbench.trust.manage');
      } else if (selection === 'Open Settings') {
        await openExtensionSettings(context);
      }

      return;
    }

    const configuration = vscode.workspace.getConfiguration(SETTINGS_NAMESPACE);
    const cliCommand = resolveCliCommandSetting(configuration.inspect<string>('cliCommand'), 'copilot');
    const configuredTerminalName = configuration.get<string>('terminalName', FALLBACK_TERMINAL_NAME);
    const terminalBaseName = normalizeTerminalName(configuredTerminalName, FALLBACK_TERMINAL_NAME);
    const terminalName = buildTerminalName(configuredTerminalName, terminalSequence, FALLBACK_TERMINAL_NAME);

    if (!cliCommand) {
      void vscode.window.showErrorMessage('Set "copilotCliLauncher.cliCommand" to the command that starts Copilot CLI.');
      return;
    }

    if (!(await confirmBootstrapperLaunch(cliCommand, context))) {
      return;
    }

    void maybeShowBootstrapperAdvisory(cliCommand, context);

    terminalSequence += 1;
    const cwd = resolveTerminalCwd(vscode.window.activeTextEditor, vscode.workspace);

    const terminal = vscode.window.createTerminal({
      name: terminalName,
      location: { viewColumn: vscode.ViewColumn.Beside },
      cwd,
    });
    terminal.show();
    watchForMissingCopilot(terminal, cliCommand, context);
    void vscode.window.setStatusBarMessage(`Started ${terminalBaseName}`, 2500);
  });

  const openSettingsCommand = vscode.commands.registerCommand('copilotCliLauncher.openSettings', async () => {
    await openExtensionSettings(context);
  });

  context.subscriptions.push(openCliCommand, openSettingsCommand);
}

export function deactivate(): void {
}
