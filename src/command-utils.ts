const FALLBACK_CLI_COMMAND = 'copilot';
const FALLBACK_TERMINAL_NAME = 'Copilot CLI';

const GH_NOT_FOUND_PATTERNS = [
  /is not recognized as a name of a cmdlet/i,
  /(?:^|\s)gh:\s+command not found/i,
  /(?:^|\s)gh: not found/i,
  /command not found:\s*gh/i,
  /\bgh\b.*not found/i,
  /no such file or directory/i,
  /cannot find the file/i,
];

const COPILOT_EXTENSION_NOT_FOUND_PATTERNS = [
  /unknown command "copilot"/i,
  /unknown command 'copilot'/i,
  /could not find extension.*copilot/i,
  /extension.*gh-copilot.*not (found|installed)/i,
  /copilot.*extension.*not (found|installed)/i,
];

type WorkspaceFolderLike<T> = { uri: T };
type WorkspaceLike<T> = {
  workspaceFolders?: readonly WorkspaceFolderLike<T>[];
  getWorkspaceFolder(uri: T): WorkspaceFolderLike<T> | undefined;
};
type ActiveEditorLike<T> = { document: { uri: T } };

/** Returns a trimmed CLI command with a safe fallback. */
export function normalizeCliCommand(value: string | undefined, fallback = FALLBACK_CLI_COMMAND): string {
  return (value ?? fallback).trim();
}

/** Returns the configured terminal base name without any numeric suffix. */
export function normalizeTerminalName(value: string | undefined, fallback = FALLBACK_TERMINAL_NAME): string {
  return (value ?? fallback).trim() || fallback;
}

/** Returns the terminal label with the numeric suffix used by the extension. */
export function buildTerminalName(value: string | undefined, sequence: number, fallback = FALLBACK_TERMINAL_NAME): string {
  const baseName = normalizeTerminalName(value, fallback);
  const suffix = sequence <= 1 ? '' : ` ${sequence}`;

  return `${baseName}${suffix}`;
}

/** Returns the settings search query for the current extension id. */
export function buildExtensionSettingsQuery(extensionId: string): string {
  return `@ext:${extensionId}`;
}

/** Extracts the executable token while preserving quoted Windows paths with spaces. */
export function extractExecutable(command: string): string {
  const normalized = command.trim();

  if (!normalized) {
    return '';
  }

  const firstCharacter = normalized[0];
  if (firstCharacter === '"' || firstCharacter === "'") {
    const closingQuoteIndex = normalized.indexOf(firstCharacter, 1);
    if (closingQuoteIndex > 0) {
      return normalized.slice(1, closingQuoteIndex);
    }
  }

  const whitespaceIndex = normalized.search(/\s/);
  return whitespaceIndex === -1 ? normalized : normalized.slice(0, whitespaceIndex);
}

/** Returns whether a terminal failure likely means the `gh` binary is missing. */
export function shouldPromptToInstallGh(command: string, exitCode: number | undefined, output: string): boolean {
  if (extractExecutable(command) !== 'gh') {
    return false;
  }

  if (exitCode === 127) {
    return true;
  }

  if (exitCode !== undefined && exitCode !== 1) {
    return false;
  }

  return GH_NOT_FOUND_PATTERNS.some((pattern) => pattern.test(output));
}

/** Returns whether a terminal failure likely means the gh-copilot extension is not installed. */
export function shouldPromptToInstallCopilotExtension(command: string, exitCode: number | undefined, output: string): boolean {
  if (extractExecutable(command) !== 'gh') {
    return false;
  }

  if (exitCode !== undefined && exitCode !== 1 && exitCode !== 0) {
    return false;
  }

  return COPILOT_EXTENSION_NOT_FOUND_PATTERNS.some((pattern) => pattern.test(output));
}

/** Resolves the terminal cwd from the active editor or the first workspace folder. */
export function resolveTerminalCwd<T>(
  activeEditor: ActiveEditorLike<T> | undefined,
  workspace: WorkspaceLike<T>,
): T | undefined {
  const activeWorkspaceFolder = activeEditor ? workspace.getWorkspaceFolder(activeEditor.document.uri) : undefined;
  return activeWorkspaceFolder?.uri ?? workspace.workspaceFolders?.[0]?.uri;
}

export { FALLBACK_CLI_COMMAND, FALLBACK_TERMINAL_NAME };
