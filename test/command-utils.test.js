const test = require('node:test');
const assert = require('node:assert/strict');

const {
  normalizeCliCommand,
  buildTerminalName,
  buildExtensionSettingsQuery,
  resolveTerminalCwd,
  extractExecutable,
  shouldOfferCopilotCliInstall,
  shouldPromptToInstallCopilot,
} = require('../out/command-utils.js');

// normalizeCliCommand
test('normalizeCliCommand trims configured values', () => {
  assert.equal(normalizeCliCommand('  copilot  '), 'copilot');
});

test('normalizeCliCommand falls back when value is undefined', () => {
  assert.equal(normalizeCliCommand(undefined), 'copilot');
});

test('normalizeCliCommand preserves the blank command path for validation', () => {
  assert.equal(normalizeCliCommand('   '), '');
});

// buildTerminalName
test('buildTerminalName uses the base name for the first terminal', () => {
  assert.equal(buildTerminalName('  Copilot CLI  ', 1), 'Copilot CLI');
});

test('buildTerminalName appends the sequence after the first terminal', () => {
  assert.equal(buildTerminalName('Copilot CLI', 3), 'Copilot CLI 3');
});

test('buildTerminalName falls back when the configured name is blank', () => {
  assert.equal(buildTerminalName('   ', 2), 'Copilot CLI 2');
});

// buildExtensionSettingsQuery
test('buildExtensionSettingsQuery targets the current extension id', () => {
  assert.equal(buildExtensionSettingsQuery('mikesoft.vscode-copilot-cli-launcher'), '@ext:mikesoft.vscode-copilot-cli-launcher');
});

// extractExecutable
test('extractExecutable returns the first token for simple commands', () => {
  assert.equal(extractExecutable('copilot'), 'copilot');
});

test('extractExecutable preserves quoted Windows paths with spaces', () => {
  assert.equal(
    extractExecutable('"C:\\Program Files\\GitHub Copilot\\copilot.exe"'),
    'C:\\Program Files\\GitHub Copilot\\copilot.exe',
  );
});

// shouldOfferCopilotCliInstall
test('shouldOfferCopilotCliInstall offers npm install for copilot executable commands', () => {
  assert.equal(shouldOfferCopilotCliInstall('copilot'), true);
  assert.equal(shouldOfferCopilotCliInstall('copilot --help'), true);
});

test('shouldOfferCopilotCliInstall does not offer npm install for different configured executables', () => {
  assert.equal(shouldOfferCopilotCliInstall('custom-copilot-agent'), false);
  assert.equal(shouldOfferCopilotCliInstall('"C:\\Program Files\\Custom Agent\\agent.exe"'), false);
});

// shouldPromptToInstallCopilot
test('shouldPromptToInstallCopilot detects PowerShell command-not-found output', () => {
  const output = "copilot: The term 'copilot' is not recognized as a name of a cmdlet, function, script file, or executable program.";
  assert.equal(shouldPromptToInstallCopilot('copilot', 1, output), true);
});

test('shouldPromptToInstallCopilot detects POSIX command-not-found exit code', () => {
  assert.equal(shouldPromptToInstallCopilot('copilot', 127, ''), true);
});

test('shouldPromptToInstallCopilot detects bash command-not-found output', () => {
  assert.equal(shouldPromptToInstallCopilot('copilot', 1, 'command not found: copilot'), true);
});

test('shouldPromptToInstallCopilot detects the missing executable from a custom command', () => {
  assert.equal(shouldPromptToInstallCopilot('custom-copilot-agent', 1, 'custom-copilot-agent: command not found'), true);
});

test('shouldPromptToInstallCopilot ignores copilot-looking output for a different configured executable', () => {
  assert.equal(shouldPromptToInstallCopilot('custom-copilot-agent', 1, 'copilot: command not found'), false);
});

test('shouldPromptToInstallCopilot ignores unrelated runtime failures', () => {
  assert.equal(shouldPromptToInstallCopilot('copilot', 1, 'Error: authentication required'), false);
});

test('shouldPromptToInstallCopilot ignores non-1 exit codes that are not 127', () => {
  assert.equal(shouldPromptToInstallCopilot('copilot', 2, 'copilot: command not found'), false);
});

// resolveTerminalCwd
test('resolveTerminalCwd uses the active editor workspace when available', () => {
  const workspace = {
    workspaceFolders: [
      { uri: 'workspace-a' },
      { uri: 'workspace-b' },
    ],
    getWorkspaceFolder(uri) {
      return uri === 'file-b' ? { uri: 'workspace-b' } : undefined;
    },
  };

  const activeEditor = {
    document: { uri: 'file-b' },
  };

  assert.equal(resolveTerminalCwd(activeEditor, workspace), 'workspace-b');
});

test('resolveTerminalCwd falls back to the first workspace when the active editor is outside the workspace', () => {
  const workspace = {
    workspaceFolders: [
      { uri: 'workspace-a' },
    ],
    getWorkspaceFolder() {
      return undefined;
    },
  };

  const activeEditor = {
    document: { uri: 'external-file' },
  };

  assert.equal(resolveTerminalCwd(activeEditor, workspace), 'workspace-a');
});

test('resolveTerminalCwd returns undefined when no workspace is open', () => {
  const workspace = {
    workspaceFolders: undefined,
    getWorkspaceFolder() {
      return undefined;
    },
  };

  assert.equal(resolveTerminalCwd(undefined, workspace), undefined);
});
