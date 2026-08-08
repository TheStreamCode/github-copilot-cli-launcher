# Documentation

This directory contains durable product and engineering documentation. The root `README.md` provides the concise product overview, quick start, configuration, and first-line troubleshooting.

## Engineering Notes

Add durable engineering notes here when a change needs more context than the code, tests, changelog, or pull request can provide. Use descriptive Markdown filenames and include the decision, alternatives considered, and validation evidence.

- [`RELEASING.md`](RELEASING.md): versioning, validation, GitHub release, and registry publication checklist
- [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md): detailed launcher diagnostics, Windows bootstrapper mitigation, missing-command guidance, and workspace behavior

The current release focuses on one-click GitHub Copilot CLI launch from the editor toolbar and safe missing-command guidance through GitHub's official installation documentation.

## Document Status

Files in `docs/` capture design and implementation decisions at a specific point in time. They may describe historical context, while the root documentation reflects the current product behavior.
