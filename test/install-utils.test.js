const test = require('node:test');
const assert = require('node:assert/strict');

const {
  COPILOT_INSTALL_COMMAND,
  buildCopilotInstallPromptCommand,
  buildCopilotInstallPromptMessage,
  buildCopilotInstallPromptScript,
  buildQuotedCommandPath,
} = require('../out/install-utils.js');

test('COPILOT_INSTALL_COMMAND uses the official npm package', () => {
  assert.equal(COPILOT_INSTALL_COMMAND, 'npm install -g @github/copilot');
});

test('buildCopilotInstallPromptMessage is concise and explicit', () => {
  assert.equal(buildCopilotInstallPromptMessage(), 'GitHub Copilot CLI was not found.');
});

test('buildCopilotInstallPromptCommand runs a generated node script path safely', () => {
  const command = buildCopilotInstallPromptCommand('C:\\Temp\\copilot install prompt.js');

  assert.equal(command, 'node "C:\\Temp\\copilot install prompt.js"');
  assert.doesNotMatch(command, /node -e/);
});

test('buildQuotedCommandPath quotes paths with spaces and escapes embedded quotes', () => {
  assert.equal(
    buildQuotedCommandPath('C:\\Program Files\\GitHub Copilot\\copilot.exe'),
    '"C:\\Program Files\\GitHub Copilot\\copilot.exe"',
  );
});

test('buildCopilotInstallPromptScript installs Copilot through npm after explicit confirmation', () => {
  const script = buildCopilotInstallPromptScript();

  assert.match(script, /GitHub Copilot CLI was not found\./);
  assert.match(script, /npm install -g @github\/copilot/);
  assert.match(script, /Install GitHub Copilot CLI now\? \(y\/N\): /);
  assert.match(script, /normalized === 'y' \|\| normalized === 'yes'/);
  assert.match(script, /stdio: 'inherit'/);
});
