# Release Process

Use this checklist for stable releases. Publishing is an external write and requires explicit maintainer authorization.

## 1. Prepare the Version

Choose the next semantic version and keep it synchronized in:

- `package.json` and `package-lock.json` (use `npm version <version> --no-git-tag-version`)
- `CITATION.cff`
- the version assertion in `test/metadata.test.js`
- the default `tag` input of `.github/workflows/publish-open-vsx.yml`
- `CHANGELOG.md`

Move completed changelog entries from `Unreleased` into a dated release section and update the comparison links.

## 2. Validate from a Clean Install

```powershell
npm ci --strict-allow-scripts
npm run check
npm run audit
$version = node -p "require('./package.json').version"
$vsixPath = ".vsce/vscode-copilot-cli-launcher-$version.vsix"
npm run package -- -- --out $vsixPath
```

Confirm that the VSIX contains only the runtime JavaScript, required metadata, licenses, documentation, and bundled product artwork.

## 3. Publish the Repository Release

Commit and push the reviewed scope to `main`, then wait for all required GitHub checks. Create and push the annotated `v<version>` tag only from the verified `main` commit.

Create the GitHub Release from that tag, use the matching changelog section as release notes, and attach the verified VSIX artifact.

## 4. Publish to Both Registries

Publishing is owner-controlled. After the GitHub Release exists, dispatch the **Release** workflow
with the release tag:

```powershell
gh workflow run release.yml -f tag=v<version>
```

The publish job downloads the released VSIX and its checksum, verifies the checksum, and publishes
the same artifact to the Visual Studio Marketplace and Open VSX through OIDC trusted publishing. No
long-lived registry token is stored in the repository or in GitHub Actions secrets.

After publishing, query `https://open-vsx.org/api/mikesoft/vscode-copilot-cli-launcher` and the
Marketplace gallery API and confirm that both versions match the Git tag and package metadata.

The older **Publish Open VSX** workflow remains available only as a migration fallback until the
first trusted-publishing run succeeds.

## 6. Final Verification

Record these states separately in the handoff:

- committed and pushed Git commit
- successful required CI checks
- Git tag and GitHub Release
- attached VSIX checksum and size
- Open VSX version
- Visual Studio Marketplace version, when published
