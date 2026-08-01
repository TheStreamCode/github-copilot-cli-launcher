# Security Policy

## Supported Versions

| Version | Supported |
| --- | --- |
| 0.2.x | Yes |
| Earlier versions | No |

## Reporting a Vulnerability

Please do not report security vulnerabilities through public GitHub issues.

Use the repository's [private vulnerability reporting form](https://github.com/TheStreamCode/github-copilot-cli-launcher/security/advisories/new), or email security concerns to info@mikesoft.it. Include a clear description, the affected version, reproduction details, and the potential impact. You can expect an acknowledgement within five business days.

Please allow a reasonable remediation window before public disclosure. The maintainer will coordinate status updates and credit with the reporter.

## Security Model

This extension launches user-configured terminal commands. Review workspace trust prompts and configuration changes before running commands in untrusted repositories.

The extension does not install GitHub Copilot CLI, create installer scripts, or invoke package managers or shell installers. If the configured CLI command is missing, it can only offer to open GitHub's [official installation documentation](https://docs.github.com/en/copilot/how-tos/copilot-cli/set-up-copilot-cli/install-copilot-cli) in the default browser.
