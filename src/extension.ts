import * as vscode from 'vscode';
import {
  FALLBACK_TERMINAL_NAME,
  buildExtensionSettingsQuery,
  buildTerminalName,
  normalizeCliCommand,
  normalizeTerminalName,
  resolveTerminalCwd,
  shouldPromptToInstallCopilot,
} from './command-utils.js';

let terminalSequence = 1;
const INSTALL_COPILOT_COMMAND = 'npm install -g @github/copilot';

function collectShellExecutionOutput(execution: vscode.TerminalShellExecution): Promise<string> {
  return (async () => {
    let output = '';
    try {
      for await (const chunk of execution.read()) {
        output += chunk;
      }
    } catch {
      // best-effort; ignore read errors
    }
    return output;
  })();
}

function watchForMissingCopilot(terminal: vscode.Terminal, cliCommand: string, context: vscode.ExtensionContext): void {
  let executionStarted = false;

  const startExecution = (shellIntegration: vscode.TerminalShellIntegration) => {
    if (executionStarted) {
      return;
    }

    executionStarted = true;
    shellIntegrationListener.dispose();
    clearTimeout(fallbackHandle);

    const execution = shellIntegration.executeCommand(cliCommand);
    const outputPromise = collectShellExecutionOutput(execution);

    const executionListener = vscode.window.onDidEndTerminalShellExecution(async (endEvent) => {
      if (endEvent.terminal !== terminal || endEvent.execution !== execution) {
        return;
      }

      executionListener.dispose();

      const output = await outputPromise;
      const { exitCode } = endEvent;

      if (shouldPromptToInstallCopilot(cliCommand, exitCode, output)) {
        const selection = await vscode.window.showWarningMessage(
          `Copilot CLI does not seem to be installed. Install it with: ${INSTALL_COPILOT_COMMAND}.`,
          'Open Install Terminal',
        );

        if (selection === 'Open Install Terminal') {
          const installTerminal = vscode.window.createTerminal({
            name: 'Install Copilot CLI',
            location: vscode.TerminalLocation.Panel,
          });
          installTerminal.show();
          installTerminal.sendText(INSTALL_COPILOT_COMMAND, true);
        }
      }
    });

    context.subscriptions.push(executionListener);
  };

  const shellIntegrationListener = vscode.window.onDidChangeTerminalShellIntegration(async (event) => {
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
    terminal.sendText(cliCommand, true);
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

export function activate(context: vscode.ExtensionContext): void {
  const openCliCommand = vscode.commands.registerCommand('copilotCliLauncher.openCli', async () => {
    const configuration = vscode.workspace.getConfiguration('copilotCliLauncher');
    const cliCommand = normalizeCliCommand(configuration.get<string>('cliCommand', 'copilot'));
    const configuredTerminalName = configuration.get<string>('terminalName', FALLBACK_TERMINAL_NAME);
    const terminalBaseName = normalizeTerminalName(configuredTerminalName, FALLBACK_TERMINAL_NAME);
    const terminalName = buildTerminalName(configuredTerminalName, terminalSequence, FALLBACK_TERMINAL_NAME);

    if (!cliCommand) {
      void vscode.window.showErrorMessage('Set "copilotCliLauncher.cliCommand" to the command that starts Copilot CLI.');
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
    await vscode.commands.executeCommand('workbench.action.openSettings', buildExtensionSettingsQuery(context.extension.id));
  });

  context.subscriptions.push(openCliCommand, openSettingsCommand);
}

export function deactivate(): void {
}
