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

/** Escapes a literal value before embedding it in a regular expression. */
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

  assert.equal(packageJson.displayName, 'Copilot CLI Launcher — Run GitHub Copilot in a Side Terminal');
  assert.equal(packageJson.description, 'Launch the GitHub Copilot CLI coding agent in a side terminal from your editor toolbar — one click, fresh terminal. Unofficial; works in VS Code, Cursor & Windsurf on Windows, macOS & Linux.');
  assert.equal(packageJson.version, '0.2.11');
  assert.equal(packageJson.private, true);
  assert.equal(packageJson.packageManager, undefined);
  assert.equal(packageJson.icon, 'media/icon.png');
  assert.equal(packageJson.contributes.configuration.title, 'Copilot CLI Launcher');

  const [openCliCommand, openSettingsCommand] = packageJson.contributes.commands;
  assert.equal(openCliCommand.command, 'copilotCliLauncher.openCli');
  assert.equal(openCliCommand.title, 'Open Copilot CLI in Side Terminal');
  assert.equal(openCliCommand.category, 'Copilot CLI Launcher');
  assert.deepEqual(openCliCommand.icon, {
    light: './media/icon.png',
    dark: './media/icon.png',
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
  assert.equal(properties['copilotCliLauncher.cliCommand'].scope, 'machine');

  assert.ok(properties['copilotCliLauncher.terminalName']);
  assert.equal(properties['copilotCliLauncher.terminalName'].default, 'Copilot CLI');
  assert.equal(properties['copilotCliLauncher.terminalName'].scope, 'window');

  assert.equal(properties['copilotCliLauncher.autoInstall'], undefined);
  assert.deepEqual(packageJson.capabilities.untrustedWorkspaces.restrictedConfigurations, [
    'copilotCliLauncher.cliCommand',
  ]);
});

test('extension assets keep Marketplace and command icons packaged on the expected paths', () => {
  const packageJson = readPackageJson();
  const marketplaceIcon = readPngSize('media/icon.png');
  const iconBytes = fs.statSync(path.join(rootDir, 'media', 'icon.png')).size;

  assert.ok(marketplaceIcon.width >= 256);
  assert.ok(marketplaceIcon.height >= 256);
  assert.ok(iconBytes < 256 * 1024);
  assert.equal(packageJson.contributes.commands[0].icon.light, './media/icon.png');
  assert.equal(packageJson.contributes.commands[0].icon.dark, './media/icon.png');
});

test('package scripts use deterministic local tooling entry points', () => {
  const packageJson = readPackageJson();

  assert.match(packageJson.scripts.clean, /rmSync\('out'/);
  assert.equal(packageJson.scripts.compile, 'npm run clean && node ./node_modules/typescript/bin/tsc -p . --pretty false');
  assert.equal(packageJson.scripts.test, 'npm run compile && node --test test/*.test.js && node ./test/integration/runTest.js');
  assert.equal(packageJson.scripts['test:integration'], 'npm run compile && node ./test/integration/runTest.js');
  assert.equal(packageJson.scripts.audit, 'npm audit --audit-level=high');
  assert.equal(packageJson.scripts.check, 'npm run compile && node --test test/*.test.js && node ./test/integration/runTest.js && node ./node_modules/@vscode/vsce/vsce ls');
  assert.equal(packageJson.scripts.package, 'node ./node_modules/@vscode/vsce/vsce package');
  assert.deepEqual(packageJson.allowScripts, {
    '@vscode/vsce-sign@2.0.9': true,
    'keytar@7.9.0': true,
  });
});

test('release metadata versions stay synchronized', () => {
  const packageJson = readPackageJson();
  const packageLock = JSON.parse(readText('package-lock.json'));
  const citation = readText('CITATION.cff');
  const changelog = readText('CHANGELOG.md');
  const openVsxWorkflow = readText('.github/workflows/publish-open-vsx.yml');
  const version = escapeRegExp(packageJson.version);

  assert.equal(packageLock.version, packageJson.version);
  assert.equal(packageLock.packages[''].version, packageJson.version);
  assert.match(citation, new RegExp(`^version: ["']?${version}["']?\\s*$`, 'm'));
  assert.match(changelog, new RegExp(`^## \\[${version}\\] - \\d{4}-\\d{2}-\\d{2}$`, 'm'));
  assert.match(openVsxWorkflow, new RegExp(`^\\s*default: v${version}\\s*$`, 'm'));
});

test('README presents the product, trust boundaries, setup, and support clearly', () => {
  const readme = readText('README.md');

  assert.match(readme, /^# Copilot CLI Launcher$/m);
  assert.match(readme, /Launch the standalone GitHub Copilot CLI coding agent from your editor toolbar/i);
  assert.match(readme, /Install from Visual Studio Marketplace/);
  assert.match(readme, /Install from Open VSX/);
  assert.match(readme, /Download the latest VSIX/);
  assert.match(readme, /## Why Copilot CLI Launcher/);
  assert.match(readme, /## Quick Start/);
  assert.match(readme, /## Features/);
  assert.match(readme, /## Compatibility/);
  assert.match(readme, /## Security and Privacy/);
  assert.match(readme, /## Missing CLI Guidance/);
  assert.match(readme, /## Configuration/);
  assert.match(readme, /## Troubleshooting/);
  assert.match(readme, /docs\/TROUBLESHOOTING\.md/);
  assert.match(readme, /Copilot CLI Launcher: Open Settings/);
  assert.match(readme, /official installation documentation/i);
  assert.match(readme, /does not download software, create installer files, or run installation commands/i);
  assert.match(readme, /npm run package/);
  assert.match(readme, /uses the active editor/i);
  assert.match(readme, /does not collect telemetry, analytics, or personal data/i);
  assert.doesNotMatch(readme, /launcher-mark\.svg/i);
  assert.doesNotMatch(readme, /media\/icon\.png/i);
});

test('SUPPORT explains when to use issues and when to contact the maintainer directly', () => {
  const support = readText('SUPPORT.md');

  assert.match(support, /^# Support$/m);
  assert.match(support, /GitHub Issues/);
  assert.match(support, /VS Code version/);
  assert.match(support, /info@mikesoft\.it/);
  assert.match(support, /https:\/\/mikesoft\.it/);
});

test('docs directory includes an accurate engineering documentation index', () => {
  const docsReadme = readText('docs/README.md');
  const agentGuide = readText('AGENTS.md');
  const releasing = readText('docs/RELEASING.md');
  const troubleshooting = readText('docs/TROUBLESHOOTING.md');

  assert.match(docsReadme, /^# Documentation$/m);
  assert.match(docsReadme, /root `README\.md`/);
  assert.match(docsReadme, /Add durable engineering notes here/i);
  assert.match(docsReadme, /TROUBLESHOOTING\.md/);
  assert.doesNotMatch(docsReadme, /`(?:specs|plans)\/`/);

  assert.match(troubleshooting, /^# Troubleshooting$/m);
  assert.match(troubleshooting, /GitHub Copilot Chat Bootstrapper Hang on Windows/);
  assert.match(troubleshooting, /## Copilot CLI Is Not Found/);
  assert.match(troubleshooting, /## Multi-root Workspaces/);
  assert.match(troubleshooting, /does not download software, create installer files, or run installation commands/i);
  assert.match(agentGuide, /npm run package -- -- --out \.vsce\/vscode-copilot-cli-launcher-<version>\.vsix/);
  assert.match(releasing, /npm run package -- -- --out \$vsixPath/);
});

test('README documents key features and privacy notes', () => {
  const readme = readText('README.md');

  assert.match(readme, /does not collect telemetry, analytics, or personal data\./i);
  assert.match(readme, /official installation documentation/i);
  assert.match(readme, /npm run package/);
});

test('changelog documents releases in Keep a Changelog format', () => {
  const changelog = readText('CHANGELOG.md');

  assert.match(changelog, /Keep a Changelog/i);
  assert.match(changelog, /## \[0\.2\.1\][\s\S]*Restored the original Marketplace and toolbar artwork/s);
  assert.match(changelog, /## \[0\.2\.0\][\s\S]*guided install flow/s);
  assert.match(changelog, /## \[0\.1\.7\]/s);
  assert.match(changelog, /## \[0\.1\.6\]/s);
  assert.match(changelog, /## \[0\.1\.5\]/s);
  assert.match(changelog, /## \[0\.1\.4\]/s);
  assert.match(changelog, /## \[0\.1\.3\]/s);
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
  assert.ok(vscodeignoreEntries.includes('AGENTS.md'));
  assert.ok(vscodeignoreEntries.includes('out/**/*.map'));
  assert.ok(vscodeignoreEntries.includes('out/install-utils.js') === false);
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
  assert.match(workflow, /run: npm install --global npm@11\.16\.0 --ignore-scripts/);
  assert.match(workflow, /run: npm ci --strict-allow-scripts/);
  assert.match(workflow, /npm run audit/);
  assert.match(workflow, /npm run check/);
  assert.match(workflow, /persist-credentials: false/);
});

test('Open VSX workflow verifies the release asset before publishing it', () => {
  const workflow = readText('.github/workflows/publish-open-vsx.yml');
  const verificationStep = workflow.indexOf('Download and verify GitHub Release asset');
  const publishStep = workflow.indexOf('Publish release asset');

  assert.ok(verificationStep >= 0);
  assert.ok(publishStep > verificationStep);
  assert.match(workflow, /Release tag must use the stable vMAJOR\.MINOR\.PATCH format/);
  assert.match(workflow, /asset_name="vscode-copilot-cli-launcher-\$\{expected\}\.vsix"/);
  assert.match(workflow, /\.assets\[\].*\.digest/);
  assert.match(workflow, /sha256sum "\$asset_path"/);
  assert.match(workflow, /unzip -p "\$asset_path" extension\/package\.json/);
  assert.match(workflow, /test "\$package_name" = 'vscode-copilot-cli-launcher'/);
  assert.match(workflow, /test "\$package_publisher" = 'mikesoft'/);
  assert.match(workflow, /test "\$package_version" = "\$expected"/);
  assert.match(workflow, /publish --packagePath "\$VSIX_PATH"/);
});

test('per-launch listeners stay out of the never-drained extension subscriptions array', () => {
  const extensionSource = readText('src/extension.ts');
  const subscriptionPushes = extensionSource.match(/context\.subscriptions\.push\(/g) ?? [];

  // VS Code drains `context.subscriptions` only at deactivate, so anything registered per launch
  // must go through the disposable registry instead. Exactly one push, inside `activate`, is
  // expected: the two commands plus the aggregate registry teardown.
  assert.equal(subscriptionPushes.length, 1);
  assert.match(extensionSource, /createDisposableRegistry\(\)/);
  assert.match(extensionSource, /launchDisposables\.track\(/);
  assert.match(extensionSource, /launchDisposables\.disposeAll\(\)/);
});

test('missing CLI guidance only opens the official installation documentation', () => {
  const packageJson = readPackageJson();
  const extensionSource = readText('src/extension.ts');
  const properties = packageJson.contributes.configuration.properties;

  assert.equal(properties['copilotCliLauncher.autoInstall'], undefined);
  assert.equal(fs.existsSync(path.join(rootDir, 'src', 'install-utils.ts')), false);
  assert.match(
    extensionSource,
    /https:\/\/docs\.github\.com\/en\/copilot\/how-tos\/copilot-cli\/set-up-copilot-cli\/install-copilot-cli/,
  );
  assert.match(extensionSource, /vscode\.env\.openExternal/);
  assert.doesNotMatch(extensionSource, /node:(?:child_process|fs|os|path)/);
  assert.doesNotMatch(extensionSource, /install-utils|tmpdir|writeFileSync|npm install|\b(?:exec|spawn)\b|shell:\s*true/);
});
