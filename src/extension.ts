import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as vscode from 'vscode';
import {
  FALLBACK_TERMINAL_NAME,
  buildExtensionSettingsQuery,
  buildTerminalName,
  normalizeTerminalName,
  resolveCliCommandSetting,
  resolveTerminalCwd,
  shouldOfferCopilotCliInstall,
  shouldPromptToInstallCopilot,
} from './command-utils.js';
import {
  buildCopilotInstallPromptCommand,
  buildCopilotInstallPromptMessage,
  buildCopilotInstallPromptScript,
} from './install-utils.js';

const SETTINGS_NAMESPACE = 'copilotCliLauncher';
const COPILOT_DOCS_URL = 'https://docs.github.com/en/copilot/how-tos/copilot-cli/set-up-copilot-cli/install-copilot-cli';

let terminalSequence = 1;

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

function writeCopilotInstallPromptScript(): string {
  const scriptPath = path.join(os.tmpdir(), `copilot-cli-launcher-install-${process.pid}-${Date.now()}.js`);
  fs.writeFileSync(scriptPath, buildCopilotInstallPromptScript(), 'utf8');

  return scriptPath;
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

function startGuidedInstall(context: vscode.ExtensionContext): void {
  const installTerminal = vscode.window.createTerminal({
    name: 'Install GitHub Copilot CLI',
    location: vscode.TerminalLocation.Panel,
  });
  const installCommand = buildCopilotInstallPromptCommand(writeCopilotInstallPromptScript());

  installTerminal.show();
  executeCommandWithOptionalShellIntegration(installTerminal, installCommand, context);
}

async function handleMissingCopilot(context: vscode.ExtensionContext, cliCommand: string): Promise<void> {
  if (!shouldOfferCopilotCliInstall(cliCommand)) {
    const selection = await vscode.window.showWarningMessage(
      `The configured Copilot CLI command could not be started: ${cliCommand}.`,
      'Open Settings',
    );

    if (selection === 'Open Settings') {
      await openExtensionSettings(context);
    }

    return;
  }

  const configuration = vscode.workspace.getConfiguration(SETTINGS_NAMESPACE);
  const autoInstall = configuration.get<boolean>('autoInstall', true);

  if (!autoInstall) {
    const selection = await vscode.window.showWarningMessage(
      `${buildCopilotInstallPromptMessage()} Install it manually or enable guided install in settings.`,
      'Open Settings',
      'Open GitHub Docs',
    );

    if (selection === 'Open Settings') {
      await openExtensionSettings(context);
    } else if (selection === 'Open GitHub Docs') {
      await openCopilotInstallInstructions();
    }

    return;
  }

  const selection = await vscode.window.showWarningMessage(
    `${buildCopilotInstallPromptMessage()} Install it now with npm?`,
    { modal: true },
    'Install',
    'Open GitHub Docs',
    'Open Settings',
  );

  if (selection === 'Install') {
    startGuidedInstall(context);
  } else if (selection === 'Open GitHub Docs') {
    await openCopilotInstallInstructions();
  } else if (selection === 'Open Settings') {
    await openExtensionSettings(context);
  }
}

function watchForMissingCopilot(terminal: vscode.Terminal, cliCommand: string, context: vscode.ExtensionContext): void {
  executeCommandWithOptionalShellIntegration(
    terminal,
    cliCommand,
    context,
    async (endEvent, output) => {
      if (shouldPromptToInstallCopilot(cliCommand, endEvent.exitCode, output)) {
        await handleMissingCopilot(context, cliCommand);
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
