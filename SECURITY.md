# Security Policy

Please do not report security vulnerabilities through public GitHub issues.

Email security concerns to info@mikesoft.it with a clear description, affected version, and reproduction details.

This extension launches user-configured terminal commands. Review workspace trust prompts and configuration changes before running commands in untrusted repositories.

The extension does not install GitHub Copilot CLI, create installer scripts, or invoke package managers or shell installers. If the configured CLI command is missing, it can only offer to open GitHub's [official installation documentation](https://docs.github.com/en/copilot/how-tos/copilot-cli/set-up-copilot-cli/install-copilot-cli) in the default browser.
