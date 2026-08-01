const test = require('node:test');
const assert = require('node:assert/strict');

const {
  appendBoundedOutput,
  normalizeCliCommand,
  buildTerminalName,
  buildExtensionSettingsQuery,
  resolveTerminalCwd,
  extractExecutable,
  resolveCliCommandSetting,
  shouldShowMissingCliGuidance,
  isGitHubCopilotChatBootstrapper,
  isDefaultBareCopilotCommand,
  classifyBootstrapperRisk,
  shouldConfirmBootstrapperLaunch,
  resolveBootstrapperPromptSelection,
} = require('../out/command-utils.js');

// appendBoundedOutput
test('appendBoundedOutput retains recent diagnostics without unbounded growth', () => {
  assert.equal(appendBoundedOutput('12345', '67890', 8), '34567890');
  assert.equal(appendBoundedOutput('existing', 'output', 0), '');
});

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

test('resolveCliCommandSetting ignores workspace-controlled values', () => {
  assert.equal(
    resolveCliCommandSetting({
      defaultValue: 'copilot',
      globalValue: 'copilot --help',
    }),
    'copilot --help',
  );
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

// shouldShowMissingCliGuidance
test('shouldShowMissingCliGuidance detects PowerShell command-not-found output', () => {
  const output = "copilot: The term 'copilot' is not recognized as a name of a cmdlet, function, script file, or executable program.";
  assert.equal(shouldShowMissingCliGuidance('copilot', 1, output), true);
});

test('shouldShowMissingCliGuidance detects POSIX command-not-found exit code', () => {
  assert.equal(shouldShowMissingCliGuidance('copilot', 127, ''), true);
});

test('shouldShowMissingCliGuidance detects bash command-not-found output', () => {
  assert.equal(shouldShowMissingCliGuidance('copilot', 1, 'command not found: copilot'), true);
});

test('shouldShowMissingCliGuidance detects the missing executable from a custom command', () => {
  assert.equal(shouldShowMissingCliGuidance('custom-copilot-agent', 1, 'custom-copilot-agent: command not found'), true);
});

test('shouldShowMissingCliGuidance ignores copilot-looking output for a different configured executable', () => {
  assert.equal(shouldShowMissingCliGuidance('custom-copilot-agent', 1, 'copilot: command not found'), false);
});

test('shouldShowMissingCliGuidance ignores unrelated runtime failures', () => {
  assert.equal(shouldShowMissingCliGuidance('copilot', 1, 'Error: authentication required'), false);
});

test('shouldShowMissingCliGuidance ignores non-1 exit codes that are not 127', () => {
  assert.equal(shouldShowMissingCliGuidance('copilot', 2, 'copilot: command not found'), false);
});

// isGitHubCopilotChatBootstrapper
test('isGitHubCopilotChatBootstrapper detects the Windows batch bootstrapper', () => {
  assert.equal(
    isGitHubCopilotChatBootstrapper(
      'C:\\Users\\Mike\\AppData\\Roaming\\Code\\User\\globalStorage\\github.copilot-chat\\copilotCli\\copilot.bat',
    ),
    true,
  );
});

test('isGitHubCopilotChatBootstrapper detects the PowerShell bootstrapper', () => {
  assert.equal(
    isGitHubCopilotChatBootstrapper(
      'C:/Users/Mike/AppData/Roaming/Code/User/globalStorage/github.copilot-chat/copilotCli/copilot.ps1',
    ),
    true,
  );
});

test('isGitHubCopilotChatBootstrapper detects the extension-less POSIX shim', () => {
  assert.equal(
    isGitHubCopilotChatBootstrapper(
      '/home/mike/.config/Code/User/globalStorage/github.copilot-chat/copilotCli/copilot',
    ),
    true,
  );
});

test('isGitHubCopilotChatBootstrapper ignores the real Copilot CLI binary', () => {
  assert.equal(
    isGitHubCopilotChatBootstrapper(
      'C:\\Users\\Mike\\AppData\\Local\\Microsoft\\WinGet\\Packages\\GitHub.Copilot_Microsoft.Winget.Source_8wekyb3d8bbwe\\copilot.exe',
    ),
    false,
  );
});

test('isGitHubCopilotChatBootstrapper ignores unrelated copilot-named files outside the extension storage', () => {
  assert.equal(isGitHubCopilotChatBootstrapper('C:\\tools\\copilotCli\\copilot.bat'), false);
});

test('isGitHubCopilotChatBootstrapper unwraps quoted paths before matching', () => {
  assert.equal(
    isGitHubCopilotChatBootstrapper(
      '"C:\\Users\\Mike\\AppData\\Roaming\\Code\\User\\globalStorage\\github.copilot-chat\\copilotCli\\copilot.ps1"',
    ),
    true,
  );
});

test('isGitHubCopilotChatBootstrapper ignores the bare command name, which is not an explicit path', () => {
  assert.equal(isGitHubCopilotChatBootstrapper('copilot'), false);
});

// isDefaultBareCopilotCommand
test('isDefaultBareCopilotCommand is true for the unmodified default command', () => {
  assert.equal(isDefaultBareCopilotCommand('copilot'), true);
});

test('isDefaultBareCopilotCommand tolerates surrounding whitespace', () => {
  assert.equal(isDefaultBareCopilotCommand('  copilot  '), true);
});

test('isDefaultBareCopilotCommand follows Windows case-insensitive command resolution', () => {
  assert.equal(isDefaultBareCopilotCommand('COPILOT'), true);
});

test('isDefaultBareCopilotCommand is false when arguments are appended', () => {
  assert.equal(isDefaultBareCopilotCommand('copilot --help'), false);
});

test('isDefaultBareCopilotCommand is false for an explicit executable path', () => {
  assert.equal(isDefaultBareCopilotCommand('"C:\\Program Files\\GitHub Copilot\\copilot.exe"'), false);
});

// classifyBootstrapperRisk
test('classifyBootstrapperRisk returns "explicit" for a path that literally points at the bootstrapper', () => {
  const bootstrapperPath = 'C:\\Users\\Mike\\AppData\\Roaming\\Code\\User\\globalStorage\\github.copilot-chat\\copilotCli\\copilot.ps1';
  assert.equal(classifyBootstrapperRisk(bootstrapperPath, 'win32'), 'explicit');
});

test('classifyBootstrapperRisk returns "explicit" even on non-Windows platforms', () => {
  const bootstrapperPath = '/home/mike/.config/Code/User/globalStorage/github.copilot-chat/copilotCli/copilot';
  assert.equal(classifyBootstrapperRisk(bootstrapperPath, 'linux'), 'explicit');
});

test('classifyBootstrapperRisk returns "possible-default" for the bare command on Windows', () => {
  assert.equal(classifyBootstrapperRisk('copilot', 'win32'), 'possible-default');
});

test('classifyBootstrapperRisk returns "none" for the bare command on non-Windows platforms', () => {
  assert.equal(classifyBootstrapperRisk('copilot', 'linux'), 'none');
  assert.equal(classifyBootstrapperRisk('copilot', 'darwin'), 'none');
});

test('classifyBootstrapperRisk returns "none" for an explicit path to the real binary', () => {
  const realPath = '"C:\\Program Files\\GitHub Copilot\\copilot.exe"';
  assert.equal(classifyBootstrapperRisk(realPath, 'win32'), 'none');
});

test('classifyBootstrapperRisk returns "none" when the command has extra arguments', () => {
  assert.equal(classifyBootstrapperRisk('copilot --help', 'win32'), 'none');
});

// shouldConfirmBootstrapperLaunch
test('shouldConfirmBootstrapperLaunch is false for "none" risk regardless of acknowledgement', () => {
  assert.equal(shouldConfirmBootstrapperLaunch('none', false), false);
  assert.equal(shouldConfirmBootstrapperLaunch('none', true), false);
});

test('shouldConfirmBootstrapperLaunch always prompts for "explicit" risk, even if acknowledged', () => {
  assert.equal(shouldConfirmBootstrapperLaunch('explicit', false), true);
  assert.equal(shouldConfirmBootstrapperLaunch('explicit', true), true);
});

test('shouldConfirmBootstrapperLaunch prompts for "possible-default" risk until acknowledged', () => {
  assert.equal(shouldConfirmBootstrapperLaunch('possible-default', false), true);
  assert.equal(shouldConfirmBootstrapperLaunch('possible-default', true), false);
});

// resolveBootstrapperPromptSelection
test('resolveBootstrapperPromptSelection proceeds and acknowledges on "Launch Anyway" for possible-default risk', () => {
  assert.deepEqual(
    resolveBootstrapperPromptSelection('possible-default', 'Launch Anyway'),
    { proceed: true, acknowledgePossibleDefault: true, action: 'none' },
  );
});

test('resolveBootstrapperPromptSelection proceeds without acknowledging on "Launch Anyway" for explicit risk', () => {
  assert.deepEqual(
    resolveBootstrapperPromptSelection('explicit', 'Launch Anyway'),
    { proceed: true, acknowledgePossibleDefault: false, action: 'none' },
  );
});

test('resolveBootstrapperPromptSelection blocks and opens settings on "Open Settings"', () => {
  assert.deepEqual(
    resolveBootstrapperPromptSelection('possible-default', 'Open Settings'),
    { proceed: false, acknowledgePossibleDefault: false, action: 'openSettings' },
  );
});

test('resolveBootstrapperPromptSelection blocks and opens docs on "Learn More"', () => {
  assert.deepEqual(
    resolveBootstrapperPromptSelection('explicit', 'Learn More'),
    { proceed: false, acknowledgePossibleDefault: false, action: 'learnMore' },
  );
});

test('resolveBootstrapperPromptSelection blocks without acknowledging on a bare dismissal (Escape/click-away)', () => {
  assert.deepEqual(
    resolveBootstrapperPromptSelection('possible-default', undefined),
    { proceed: false, acknowledgePossibleDefault: false, action: 'none' },
  );
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
