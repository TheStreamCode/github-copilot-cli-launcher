const test = require('node:test');
const assert = require('node:assert/strict');

const {
  normalizeCliCommand,
  normalizeTerminalName,
  buildTerminalName,
  buildExtensionSettingsQuery,
  extractExecutable,
  resolveTerminalCwd,
  shouldPromptToInstallGh,
  shouldPromptToInstallCopilotExtension,
} = require('../out/command-utils.js');

// normalizeCliCommand
test('normalizeCliCommand trims configured values', () => {
  assert.equal(normalizeCliCommand('  gh copilot  '), 'gh copilot');
});

test('normalizeCliCommand falls back when value is undefined', () => {
  assert.equal(normalizeCliCommand(undefined), 'copilot');
});

test('normalizeCliCommand preserves the blank command path for validation', () => {
  assert.equal(normalizeCliCommand('   '), '');
});

// buildTerminalName
test('buildTerminalName uses the base name for the first terminal', () => {
  assert.equal(buildTerminalName('  GitHub Copilot CLI  ', 1), 'GitHub Copilot CLI');
});

test('buildTerminalName appends the sequence after the first terminal', () => {
  assert.equal(buildTerminalName('GitHub Copilot CLI', 3), 'GitHub Copilot CLI 3');
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
  assert.equal(extractExecutable('gh copilot'), 'gh');
});

test('extractExecutable returns the full command when no arguments', () => {
  assert.equal(extractExecutable('gh'), 'gh');
});

test('extractExecutable preserves quoted Windows paths with spaces', () => {
  assert.equal(
    extractExecutable('"C:\\Program Files\\GitHub CLI\\gh.exe" copilot'),
    'C:\\Program Files\\GitHub CLI\\gh.exe',
  );
});

// shouldPromptToInstallGh
test('shouldPromptToInstallGh detects PowerShell command-not-found output', () => {
  const output = "gh: The term 'gh' is not recognized as a name of a cmdlet, function, script file, or executable program.";
  assert.equal(shouldPromptToInstallGh('gh copilot', 1, output), true);
});

test('shouldPromptToInstallGh detects POSIX command-not-found exit code', () => {
  assert.equal(shouldPromptToInstallGh('gh copilot', 127, ''), true);
});

test('shouldPromptToInstallGh detects bash command-not-found output', () => {
  assert.equal(shouldPromptToInstallGh('gh copilot', 1, 'command not found: gh'), true);
});

test('shouldPromptToInstallGh ignores custom commands that do not start with gh', () => {
  assert.equal(shouldPromptToInstallGh('/usr/local/bin/gh copilot', 127, ''), false);
});

test('shouldPromptToInstallGh ignores unrelated runtime failures', () => {
  assert.equal(shouldPromptToInstallGh('gh copilot', 1, 'Error: authentication required'), false);
});

test('shouldPromptToInstallGh ignores non-1 exit codes that are not 127', () => {
  assert.equal(shouldPromptToInstallGh('gh copilot', 2, 'gh: command not found'), false);
});

// shouldPromptToInstallCopilotExtension
test('shouldPromptToInstallCopilotExtension detects unknown command output', () => {
  assert.equal(shouldPromptToInstallCopilotExtension('gh copilot', 1, 'gh: error: unknown command "copilot" for "gh"'), true);
});

test('shouldPromptToInstallCopilotExtension detects extension not found output', () => {
  assert.equal(shouldPromptToInstallCopilotExtension('gh copilot', 1, 'could not find extension copilot'), true);
});

test('shouldPromptToInstallCopilotExtension ignores custom commands', () => {
  assert.equal(shouldPromptToInstallCopilotExtension('/usr/local/bin/gh copilot', 1, 'unknown command "copilot"'), false);
});

test('shouldPromptToInstallCopilotExtension ignores unrelated failures', () => {
  assert.equal(shouldPromptToInstallCopilotExtension('gh copilot', 1, 'Error: authentication required'), false);
});

test('shouldPromptToInstallCopilotExtension ignores non-1 exit codes', () => {
  assert.equal(shouldPromptToInstallCopilotExtension('gh copilot', 2, 'unknown command "copilot"'), false);
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
