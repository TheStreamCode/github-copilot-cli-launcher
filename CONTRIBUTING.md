# Contributing

Thanks for your interest in improving Copilot CLI Launcher.

## Development

Use Node.js 22 with npm 11.16.0. Install the exact dependency graph from the lockfile while enforcing the reviewed install-script allowlist, then run the complete validation suite:

```bash
npm ci --strict-allow-scripts
npm run check
npm run audit
```

`npm run check` compiles from a clean `out/` directory, runs unit and metadata tests, launches the VS Code integration smoke test, and verifies the VSIX file list. Use `npm run package` to build a local VSIX after the checks pass.

Keep changes focused and covered by tests. Update `README.md` and `CHANGELOG.md` when behavior changes. Do not add official GitHub, Microsoft, or Copilot logos, marks, screenshots, or branding assets unless you have permission to use them.

## Pull Requests

- Keep user-facing behavior documented in `README.md`.
- Add or update tests for launcher behavior and package metadata.
- Keep generated files, local VSIX packages, credentials, and editor state out of commits.
- Run `npm run check` and `npm run audit` before submitting changes.
