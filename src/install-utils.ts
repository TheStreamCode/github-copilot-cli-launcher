const COPILOT_INSTALL_COMMAND = 'npm install -g @github/copilot';

function quoteJavaScriptString(value: string): string {
  return JSON.stringify(value);
}

/** Returns the terminal-facing missing CLI message. */
export function buildCopilotInstallPromptMessage(): string {
  return 'GitHub Copilot CLI was not found.';
}

/** Quotes a command path so it can be sent directly to an integrated terminal. */
export function buildQuotedCommandPath(commandPath: string): string {
  return `"${commandPath.replace(/"/g, '\\"')}"`;
}

/** Returns the short terminal command that runs the generated installer script. */
export function buildCopilotInstallPromptCommand(scriptPath: string): string {
  return `node ${buildQuotedCommandPath(scriptPath)}`;
}

/** Returns the Node installer script executed inside a visible VS Code terminal after user consent. */
export function buildCopilotInstallPromptScript(installCommand = COPILOT_INSTALL_COMMAND): string {
  const message = quoteJavaScriptString(buildCopilotInstallPromptMessage());
  const prompt = quoteJavaScriptString('Install GitHub Copilot CLI now? (y/N): ');
  const command = quoteJavaScriptString(installCommand);

  return String.raw`const cp = require('node:child_process');
const readline = require('node:readline');

const installCommand = ${command};
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log(${message});
rl.question(${prompt}, (answer) => {
  rl.close();
  const normalized = answer.trim().toLowerCase();
  if (normalized === 'y' || normalized === 'yes') {
    const child = cp.spawn(installCommand, [], { stdio: 'inherit', shell: true });
    child.on('exit', (code) => process.exit(code === null ? 1 : code));
    child.on('error', () => process.exit(1));
    return;
  }

  process.exit(0);
});
`;
}

export { COPILOT_INSTALL_COMMAND };
