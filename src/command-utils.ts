const FALLBACK_CLI_COMMAND = 'copilot';
const FALLBACK_TERMINAL_NAME = 'Copilot CLI';
const MAX_CAPTURED_SHELL_OUTPUT_LENGTH = 64 * 1024;

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

/** Keeps only the most recent terminal output needed for post-execution diagnostics. */
export function appendBoundedOutput(
  currentOutput: string,
  chunk: string,
  maxLength = MAX_CAPTURED_SHELL_OUTPUT_LENGTH,
): string {
  if (maxLength <= 0) {
    return '';
  }

  const combinedOutput = currentOutput + chunk;
  return combinedOutput.length <= maxLength
    ? combinedOutput
    : combinedOutput.slice(-maxLength);
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
 * Returns whether `command` is the bare default (`copilot`, case-insensitive, with no explicit
 * path, arguments, or quoting). On Windows this bare name can resolve, via PATH, to GitHub's Copilot
 * Chat bootstrapper instead of the real Copilot CLI binary if that bootstrapper's directory
 * appears earlier on PATH — a known, reported hang. This check is a text-only heuristic: it
 * flags the condition that makes the hang *possible*, not a confirmed resolution, since
 * confirming it would require filesystem access this extension intentionally does not perform.
 */
export function isDefaultBareCopilotCommand(command: string): boolean {
  return command.trim().toLowerCase() === FALLBACK_CLI_COMMAND;
}

/**
 * `'explicit'` — `cliCommand` is a path that literally points at the bootstrapper.
 * `'possible-default'` — `cliCommand` is the bare default `copilot` on Windows, where PATH order
 * (outside this extension's visibility) decides whether the bootstrapper actually runs.
 * `'none'` — no known bootstrapper-hang risk.
 */
export type BootstrapperRisk = 'explicit' | 'possible-default' | 'none';

/**
 * Classifies the bootstrapper-hang risk of launching `cliCommand` on `platform`, combining
 * {@link isGitHubCopilotChatBootstrapper} and {@link isDefaultBareCopilotCommand}. Centralizing
 * the decision here keeps it a pure, unit-testable function; `extension.ts` only maps the result
 * to a VS Code prompt.
 */
export function classifyBootstrapperRisk(cliCommand: string, platform: string): BootstrapperRisk {
  if (isGitHubCopilotChatBootstrapper(cliCommand)) {
    return 'explicit';
  }

  if (platform === 'win32' && isDefaultBareCopilotCommand(cliCommand)) {
    return 'possible-default';
  }

  return 'none';
}

/**
 * Returns whether launching should pause for a confirmation prompt. `'explicit'` risk always
 * prompts. `'possible-default'` risk prompts once per VS Code session — repeated launches skip
 * the prompt only after the user has explicitly acknowledged it via
 * {@link resolveBootstrapperPromptSelection}, never merely because the prompt was shown.
 */
export function shouldConfirmBootstrapperLaunch(risk: BootstrapperRisk, possibleDefaultAcknowledged: boolean): boolean {
  if (risk === 'none') {
    return false;
  }

  return !(risk === 'possible-default' && possibleDefaultAcknowledged);
}

/** Outcome of a bootstrapper confirmation prompt: whether to proceed, and what follow-up action, if any, to take. */
export type BootstrapperPromptOutcome = {
  proceed: boolean;
  acknowledgePossibleDefault: boolean;
  action: 'openSettings' | 'learnMore' | 'none';
};

/**
 * Maps a `vscode.window.showWarningMessage` button selection (or `undefined` for any dismissal —
 * Escape, clicking outside, or an unrecognized value) to a confirmation outcome. Only the
 * explicit "Launch Anyway" selection proceeds; every other outcome, including a bare dismissal,
 * blocks the launch. Acknowledgement (suppressing future `'possible-default'` prompts this
 * session) is granted only alongside an explicit "Launch Anyway" for that risk level — never for
 * `'explicit'` risk, which always re-prompts, and never for a dismissal.
 */
export function resolveBootstrapperPromptSelection(risk: BootstrapperRisk, selection: string | undefined): BootstrapperPromptOutcome {
  if (selection === 'Launch Anyway') {
    return { proceed: true, acknowledgePossibleDefault: risk === 'possible-default', action: 'none' };
  }

  if (selection === 'Open Settings') {
    return { proceed: false, acknowledgePossibleDefault: false, action: 'openSettings' };
  }

  if (selection === 'Learn More') {
    return { proceed: false, acknowledgePossibleDefault: false, action: 'learnMore' };
  }

  return { proceed: false, acknowledgePossibleDefault: false, action: 'none' };
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

/** Minimal structural shape of a VS Code disposable, kept free of the `vscode` module. */
export type DisposableLike = { dispose(): void };

/** Tracks short-lived disposables and releases each entry as soon as it is disposed. */
export type DisposableRegistry = {
  /** Registers `disposable` and returns a handle that disposes and deregisters it exactly once. */
  track(disposable: DisposableLike): DisposableLike;
  /** Disposes every entry that is still pending and empties the registry. */
  disposeAll(): void;
  /** Number of entries still pending. */
  size(): number;
};

/**
 * Creates a registry for disposables whose lifetime is shorter than the extension's.
 *
 * VS Code drains `ExtensionContext.subscriptions` only at deactivate, so pushing per-launch
 * listeners and timers there grows that array on every launch and keeps their closures — including
 * captured terminal output — alive for the rest of the session. Entries registered here deregister
 * themselves the moment they are disposed, so the registry stays proportional to the work that is
 * actually still in flight, while {@link DisposableRegistry.disposeAll} still guarantees cleanup at
 * shutdown through a single `subscriptions` entry.
 */
export function createDisposableRegistry(): DisposableRegistry {
  const pending = new Set<DisposableLike>();

  return {
    track(disposable: DisposableLike): DisposableLike {
      const handle: DisposableLike = {
        dispose: () => {
          if (!pending.delete(handle)) {
            return;
          }

          disposable.dispose();
        },
      };

      pending.add(handle);

      return handle;
    },

    disposeAll(): void {
      for (const handle of [...pending]) {
        handle.dispose();
      }

      pending.clear();
    },

    size(): number {
      return pending.size;
    },
  };
}

/** Resolves the terminal cwd from the active editor or the first workspace folder. */
export function resolveTerminalCwd<T>(
  activeEditor: ActiveEditorLike<T> | undefined,
  workspace: WorkspaceLike<T>,
): T | undefined {
  const activeWorkspaceFolder = activeEditor ? workspace.getWorkspaceFolder(activeEditor.document.uri) : undefined;
  return activeWorkspaceFolder?.uri ?? workspace.workspaceFolders?.[0]?.uri;
}

export { FALLBACK_CLI_COMMAND, FALLBACK_TERMINAL_NAME, MAX_CAPTURED_SHELL_OUTPUT_LENGTH };
