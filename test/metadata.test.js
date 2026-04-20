const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const PNG_SIGNATURE_SIZE = 8;

/** Returns UTF-8 file contents from the repository root. */
function readText(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf8');
}

/** Parses package.json for deterministic metadata assertions. */
function readPackageJson() {
  return JSON.parse(readText('package.json'));
}

/** Returns non-empty ignore entries for line-based assertions. */
function readIgnoreEntries(relativePath) {
  return readText(relativePath)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Reads PNG dimensions directly from the IHDR chunk. */
function readPngSize(relativePath) {
  const fileBuffer = fs.readFileSync(path.join(rootDir, relativePath));
  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  assert.deepEqual(fileBuffer.subarray(0, PNG_SIGNATURE_SIZE), pngSignature);

  return {
    width: fileBuffer.readUInt32BE(16),
    height: fileBuffer.readUInt32BE(20),
  };
}

test('package metadata uses Copilot CLI Launcher branding', () => {
  const packageJson = readPackageJson();

  assert.equal(packageJson.displayName, 'Copilot CLI Launcher');
  assert.equal(packageJson.description, 'Unofficial VS Code extension that opens Copilot CLI in a side terminal.');
  assert.equal(packageJson.version, '0.1.4');
  assert.equal(packageJson.packageManager, undefined);
  assert.equal(packageJson.icon, 'media/icon.png');
  assert.equal(packageJson.contributes.configuration.title, 'Copilot CLI Launcher');

  const [openCliCommand, openSettingsCommand] = packageJson.contributes.commands;
  assert.equal(openCliCommand.command, 'copilotCliLauncher.openCli');
  assert.equal(openCliCommand.title, 'Open Copilot CLI in Side Terminal');
  assert.equal(openCliCommand.category, 'Copilot CLI Launcher');
  assert.deepEqual(openCliCommand.icon, {
    light: './media/launcher-mark.svg',
    dark: './media/launcher-mark.svg',
  });
  assert.equal(openSettingsCommand.command, 'copilotCliLauncher.openSettings');
  assert.equal(openSettingsCommand.category, 'Copilot CLI Launcher');
  assert.equal(openSettingsCommand.title, 'Open Settings');
});

test('package settings include cliCommand and terminalName', () => {
  const packageJson = readPackageJson();
  const properties = packageJson.contributes.configuration.properties;

  assert.ok(properties['copilotCliLauncher.cliCommand']);
  assert.equal(properties['copilotCliLauncher.cliCommand'].default, 'copilot');

  assert.ok(properties['copilotCliLauncher.terminalName']);
  assert.equal(properties['copilotCliLauncher.terminalName'].default, 'Copilot CLI');
});

test('extension assets keep Marketplace and command icons packaged on the expected paths', () => {
  const marketplaceIcon = readPngSize('media/icon.png');
  const commandIcon = readText('media/launcher-mark.svg');

  assert.ok(marketplaceIcon.width >= 256);
  assert.ok(marketplaceIcon.height >= 256);
  assert.match(commandIcon, /<svg/i);
  assert.ok(commandIcon.length > 0);
});

test('package scripts use deterministic local tooling entry points', () => {
  const packageJson = readPackageJson();

  assert.equal(packageJson.scripts.compile, 'node ./node_modules/typescript/bin/tsc -p . --pretty false');
  assert.equal(packageJson.scripts.test, 'node ./node_modules/typescript/bin/tsc -p . --pretty false && node --test test/*.test.js && node ./test/integration/runTest.js');
  assert.equal(packageJson.scripts['test:integration'], 'node ./node_modules/typescript/bin/tsc -p . --pretty false && node ./test/integration/runTest.js');
  assert.equal(packageJson.scripts.check, 'node ./node_modules/typescript/bin/tsc -p . --pretty false && node --test test/*.test.js && node ./test/integration/runTest.js && node ./node_modules/@vscode/vsce/vsce ls');
  assert.equal(packageJson.scripts.package, 'node ./node_modules/@vscode/vsce/vsce package');
});

test('README is organized around user-facing setup, configuration, and troubleshooting', () => {
  const readme = readText('README.md');

  assert.match(readme, /^# Copilot CLI Launcher$/m);
  assert.match(readme, /opens Copilot CLI in a new side terminal/i);
  assert.match(readme, /Works on Windows, macOS, and Linux\./);
  assert.match(readme, /This extension is unofficial and is not affiliated with, endorsed by, or sponsored by GitHub or Microsoft\./);
  assert.match(readme, /## Features/);
  assert.match(readme, /## Configuration/);
  assert.match(readme, /## Troubleshooting/);
  assert.match(readme, /Copilot CLI Launcher: Open Settings/);
  assert.match(readme, /gh extension install github\/gh-copilot/);
  assert.match(readme, /npm run package/);
  assert.match(readme, /uses the active editor/i);
  assert.match(readme, /does not collect telemetry, analytics, or personal data/i);
  assert.doesNotMatch(readme, /launcher-mark\.svg/i);
  assert.doesNotMatch(readme, /media\/icon\.png/i);
  assert.doesNotMatch(readme, /install detection/i);
});

test('SUPPORT explains when to use issues and when to contact the maintainer directly', () => {
  const support = readText('SUPPORT.md');

  assert.match(support, /^# Support$/m);
  assert.match(support, /GitHub Issues/);
  assert.match(support, /VS Code version/);
  assert.match(support, /info@mikesoft\.it/);
  assert.match(support, /https:\/\/mikesoft\.it/);
});

test('docs directory includes an index for engineering documents', () => {
  const docsReadme = readText('docs/README.md');

  assert.match(docsReadme, /^# Documentation$/m);
  assert.match(docsReadme, /root `README\.md`/);
  assert.match(docsReadme, /`specs\/`/);
  assert.match(docsReadme, /`plans\/`/);
});

test('README documents key features and privacy notes', () => {
  const readme = readText('README.md');

  assert.match(readme, /does not collect telemetry, analytics, or personal data\./i);
  assert.match(readme, /gh extension install github\/gh-copilot/);
  assert.match(readme, /npm run package/);
});

test('changelog documents releases in Keep a Changelog format', () => {
  const changelog = readText('CHANGELOG.md');

  assert.match(changelog, /Keep a Changelog/i);
  assert.match(changelog, /## \[0\.1\.2\]/s);
  assert.match(changelog, /## \[0\.1\.1\]/s);
  assert.match(changelog, /## \[0\.1\.0\]/s);
  assert.match(changelog, /Initial release/s);
  assert.match(changelog, /toolbar button/si);
});

test('ignore rules keep tests docs source maps and local tooling out of artifacts', () => {
  const gitignoreEntries = readIgnoreEntries('.gitignore');
  const vscodeignoreEntries = readIgnoreEntries('.vscodeignore');

  assert.ok(gitignoreEntries.includes('.vsce/'));
  assert.ok(gitignoreEntries.includes('coverage/'));
  assert.ok(gitignoreEntries.includes('*.log'));
  assert.ok(gitignoreEntries.includes('.copilot/'));
  assert.ok(gitignoreEntries.includes('out/**/*.map'));
  assert.ok(gitignoreEntries.includes('package-lock.json') === false);

  assert.ok(vscodeignoreEntries.includes('test/**'));
  assert.ok(vscodeignoreEntries.includes('docs/**'));
  assert.ok(vscodeignoreEntries.includes('.gitignore'));
  assert.ok(vscodeignoreEntries.includes('out/**/*.map'));
  assert.ok(vscodeignoreEntries.includes('*.tsbuildinfo'));
  assert.ok(vscodeignoreEntries.includes('.vsce/**'));
  assert.ok(vscodeignoreEntries.includes('package-lock.json'));
});

test('CI workflow validates the extension with npm on Windows and Linux', () => {
  const workflow = readText('.github/workflows/ci.yml');

  assert.match(workflow, /^name: CI$/m);
  assert.match(workflow, /windows-latest/);
  assert.match(workflow, /ubuntu-latest/);
  assert.match(workflow, /cache: npm/);
  assert.match(workflow, /npm ci/);
  assert.match(workflow, /npm run check/);
});
