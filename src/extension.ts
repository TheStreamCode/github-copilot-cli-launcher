import * as vscode from 'vscode';
import {
  FALLBACK_TERMINAL_NAME,
  buildExtensionSettingsQuery,
  buildTerminalName,
  classifyBootstrapperRisk,
  normalizeTerminalName,
  resolveBootstrapperPromptSelection,
  resolveCliCommandSetting,
  resolveTerminalCwd,
  shouldConfirmBootstrapperLaunch,
  shouldShowMissingCliGuidance,
} from './command-utils.js';

const SETTINGS_NAMESPACE = 'copilotCliLauncher';
const COPILOT_DOCS_URL = 'https://docs.github.com/en/copilot/how-tos/copilot-cli/set-up-copilot-cli/install-copilot-cli';
const BOOTSTRAPPER_HANG_DOCS_URL = 'https://github.com/TheStreamCode/github-copilot-cli-launcher#known-issue-github-copilot-chat-bootstrapper-hang';

let terminalSequence = 1;

/**
 * Tracks whether the user has explicitly clicked "Launch Anyway" for the `possible-default` risk
 * (the bare `copilot` command, which may or may not actually resolve to the bootstrapper) during
 * this VS Code session. Set only on that explicit affirmative choice — dismissing the prompt
 * (Escape, clicking outside, or picking any other option) never sets it, so an accidental
 * dismissal blocks the next launch too instead of silently allowing it.
 */
let bootstrapperRiskAcknowledged = false;

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

function bootstrapperPromptMessage(risk: 'explicit' | 'possible-default', cliCommand: string): string {
  return risk === 'explicit'
    ? `"${cliCommand}" points directly at GitHub's Copilot Chat bootstrapper script, which can hang instead of exiting and leave a stuck background process running. Point "copilotCliLauncher.cliCommand" at the real Copilot CLI executable to avoid this.`
    : 'If GitHub Copilot Chat is installed in VS Code, its bootstrapper script can shadow the plain "copilot" command on PATH and hang instead of exiting, leaving a stuck background process running. This extension cannot tell which binary "copilot" will actually resolve to.';
}

/**
 * Returns `true` when it is safe to proceed with launching `cliCommand`. Both bootstrapper-hang
 * risk levels block the launch until the user makes an explicit choice:
 *
 * - `'explicit'`: `cliCommand` is a path that literally points at GitHub Copilot Chat's
 *   `copilot`/`copilot.bat`/`copilot.ps1` bootstrapper. Always re-prompts.
 * - `'possible-default'`: `cliCommand` is the bare default `copilot` on Windows, which *may*
 *   resolve to the bootstrapper depending on `PATH` order this extension cannot see. Prompts once
 *   per session; re-prompts on every launch until explicitly acknowledged.
 *
 * Only an explicit "Launch Anyway" click proceeds or acknowledges. Dismissing the prompt any
 * other way (Escape, clicking outside, "Open Settings", "Learn More") blocks this launch and — for
 * `'possible-default'` — never suppresses the next one either, since the user never confirmed the
 * risk is acceptable. The decision logic lives in `command-utils.ts` as pure, unit-tested
 * functions; this function only wires VS Code's prompt API to those decisions.
 */
async function confirmBootstrapperLaunch(cliCommand: string, context: vscode.ExtensionContext): Promise<boolean> {
  const risk = classifyBootstrapperRisk(cliCommand, process.platform);

  if (!shouldConfirmBootstrapperLaunch(risk, bootstrapperRiskAcknowledged)) {
    return true;
  }

  const selection = await vscode.window.showWarningMessage(
    bootstrapperPromptMessage(risk as 'explicit' | 'possible-default', cliCommand),
    'Launch Anyway',
    'Open Settings',
    'Learn More',
  );

  const outcome = resolveBootstrapperPromptSelection(risk, selection);

  if (outcome.acknowledgePossibleDefault) {
    bootstrapperRiskAcknowledged = true;
  }

  if (outcome.action === 'openSettings') {
    await openExtensionSettings(context);
  } else if (outcome.action === 'learnMore') {
    await vscode.env.openExternal(vscode.Uri.parse(BOOTSTRAPPER_HANG_DOCS_URL));
  }

  return outcome.proceed;
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
