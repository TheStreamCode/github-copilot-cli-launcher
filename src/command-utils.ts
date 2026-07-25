const FALLBACK_CLI_COMMAND = 'copilot';
const FALLBACK_TERMINAL_NAME = 'Copilot CLI';

type WorkspaceFolderLike<T> = { uri: T };
type WorkspaceLike<T> = {
  workspaceFolders?: readonly WorkspaceFolderLike<T>[];
  getWorkspaceFolder(uri: T): WorkspaceFolderLike<T> | undefined;
};
type ActiveEditorLike<T> = { document: { uri: T } };
type ConfigurationInspectionLike<T> = {
  defaultValue?: T;
  globalValue?: T;
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getExecutableBaseName(command: string): string {
  const executable = extractExecutable(command);
  const fileName = executable.split(/[\\/]/).pop() ?? executable;

  return fileName.replace(/\.(?:exe|cmd|bat|ps1)$/i, '');
}

function buildCommandNotFoundPatterns(command: string): RegExp[] {
  const executableName = getExecutableBaseName(command);

  if (!executableName) {
    return [];
  }

  const escapedName = escapeRegExp(executableName);

  return [
    new RegExp(`(?:^|\\s)${escapedName}:\\s+command not found`, 'i'),
    new RegExp(`(?:^|\\s)${escapedName}:\\s+not found`, 'i'),
    new RegExp(`command not found:\\s*${escapedName}`, 'i'),
    new RegExp(`unknown command:?\\s*${escapedName}`, 'i'),
    new RegExp(`['"]?${escapedName}['"]?.*is not recognized`, 'i'),
    new RegExp(`\\b${escapedName}\\b.*not found`, 'i'),
    new RegExp(`\\b${escapedName}\\b.*cannot find the file`, 'i'),
  ];
}

/** Returns a trimmed CLI command with a safe fallback. */
export function normalizeCliCommand(value: string | undefined, fallback = FALLBACK_CLI_COMMAND): string {
  return (value ?? fallback).trim();
}

/** Resolves launch command from user-level configuration only, ignoring workspace-controlled values. */
export function resolveCliCommandSetting(
  inspection: ConfigurationInspectionLike<string> | undefined,
  fallback = FALLBACK_CLI_COMMAND,
): string {
  const value = inspection?.globalValue !== undefined
    ? inspection.globalValue
    : inspection?.defaultValue ?? fallback;

  return normalizeCliCommand(value, fallback);
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

/**
 * Returns whether an explicit executable path (as configured by the user, not resolved against
 * PATH) is GitHub's own `copilot`/`copilot.bat`/`copilot.ps1` bootstrapper, installed under the
 * `github.copilot-chat` extension's global storage. That bootstrapper can hang instead of
 * exiting when launched as a terminal child process, leaving an orphaned `powershell.exe`
 * process behind. See README "Known Issue: GitHub Copilot Chat Bootstrapper Hang" for details.
 *
 * This checks only the literal configured path — it never touches the filesystem or resolves
 * PATH, so it cannot detect the same hang when the command is the bare, unqualified `copilot`
 * name and a shell resolves it to the bootstrapper. `isDefaultBareCopilotCommand` covers that
 * case with a one-time advisory instead, since confirming the actual PATH resolution would
 * require filesystem access this extension intentionally does not perform.
 */
export function isGitHubCopilotChatBootstrapper(explicitPath: string): boolean {
  const executable = extractExecutable(explicitPath);
  if (!/[\\/]/.test(executable)) {
    return false;
  }

  const normalized = executable.replace(/\\/g, '/').toLowerCase();

  return (
    /\/copilotcli\/copilot(\.bat|\.cmd|\.ps1)?$/.test(normalized)
    && normalized.includes('/github.copilot-chat/')
  );
}

/**
 * Returns whether `command` is the unmodified default (`copilot`, with no explicit path,
 * arguments, or quoting). On Windows this bare name can resolve, via PATH, to GitHub's Copilot
 * Chat bootstrapper instead of the real Copilot CLI binary if that bootstrapper's directory
 * appears earlier on PATH — a known, reported hang. This check is a text-only heuristic: it
 * flags the condition that makes the hang *possible*, not a confirmed resolution, since
 * confirming it would require filesystem access this extension intentionally does not perform.
 */
export function isDefaultBareCopilotCommand(command: string): boolean {
  return command.trim() === FALLBACK_CLI_COMMAND;
}

/** Returns whether a terminal failure likely means the copilot CLI is missing. */
export function shouldShowMissingCliGuidance(command: string, exitCode: number | undefined, output: string): boolean {
  if (exitCode === 127) {
    return true;
  }

  if (exitCode !== undefined && exitCode !== 1) {
    return false;
  }

  return buildCommandNotFoundPatterns(command).some((pattern) => pattern.test(output));
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
