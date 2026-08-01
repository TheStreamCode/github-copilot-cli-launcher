# Release Process

Use this checklist for stable releases. Publishing is an external write and requires explicit maintainer authorization.

## 1. Prepare the Version

Choose the next semantic version and keep it synchronized in:

- `package.json`
- `package-lock.json`
- `CITATION.cff`
- version-sensitive metadata tests
- `CHANGELOG.md`

Move completed changelog entries from `Unreleased` into a dated release section and update the comparison links.

## 2. Validate from a Clean Install

```powershell
npm ci
npm run check
npm run audit
$version = node -p "require('./package.json').version"
$vsixPath = ".vsce/vscode-copilot-cli-launcher-$version.vsix"
npm run package -- --out $vsixPath
```

Confirm that the VSIX contains only the runtime JavaScript, required metadata, licenses, documentation, and bundled product artwork.

## 3. Publish the Repository Release

Commit and push the reviewed scope to `main`, then wait for all required GitHub checks. Create and push the annotated `v<version>` tag only from the verified `main` commit.

Create the GitHub Release from that tag, use the matching changelog section as release notes, and attach the verified VSIX artifact.

## 4. Publish to Open VSX

Provide `OVSX_PAT` through an approved environment or CI secret store. Never pass the token as a command argument or commit it to the repository.

For the standard repository flow, save it as the GitHub Actions secret `OVSX_PAT`, then manually dispatch **Publish Open VSX** with the existing GitHub Release tag. The workflow downloads and publishes that release's verified VSIX asset and confirms the registry version.

For an authorized local fallback:

```powershell
npx --yes ovsx verify-pat mikesoft
npx --yes ovsx publish --packagePath $vsixPath
```

After publishing, query `https://open-vsx.org/api/mikesoft/vscode-copilot-cli-launcher` and confirm that its version matches the Git tag and package metadata.

## 5. Optional Visual Studio Marketplace Publication

Marketplace publication is a separate authorized action. Use the official `vsce` workflow with a securely supplied publisher token, then verify the public Marketplace API rather than assuming the command completed the rollout.

## 6. Final Verification

Record these states separately in the handoff:

- committed and pushed Git commit
- successful required CI checks
- Git tag and GitHub Release
- attached VSIX checksum and size
- Open VSX version
- Visual Studio Marketplace version, when published
