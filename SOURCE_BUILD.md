# Mozilla reviewer build instructions

This source archive rebuilds the submitted Image Description extension. The
extension is written in TypeScript and bundled locally with Vite, so source code is
provided with every AMO version.

## Build environment

The release is compatible with Mozilla's default reviewer environment:

- Ubuntu 24.04.4 LTS on ARM64;
- Node.js 24.14.0; and
- npm 11.9.0.

The project declares support for Node.js versions 22 through 26. All build tools are
open-source npm development dependencies. No proprietary or web-based build tool is
used.

## Rebuild the extension

From the root of the extracted source archive, run exactly:

```text
npm ci
npm run build
```

The rebuilt extension is in `build/`. Compare the contents of that directory with
the unpacked extension submitted to AMO. The authoritative manifest source is
`src/manifest.json`; Vite copies it to `build/manifest.json` and bundles the
TypeScript entry points. `package-lock.json` fixes all npm dependency versions.

To run the automated checks and create the same installable ZIP locally, run:

```text
npm test
npm run lint
npm run typecheck
npm run format:check
npm run package
```

`npm run package` writes the extension ZIP to `web-ext-artifacts/`. It does not
contact a model provider. No API key or provider configuration is needed to build or
test the extension.

## Prepare the reviewer source archive

From a clean, committed checkout, run:

```text
npm run source-package
```

This creates `source-artifacts/image-description-<version>-source.zip` directly from
the current Git commit. Generated files, dependencies, editor state, and local
secrets are excluded because they are not tracked by Git. The archive includes this
file, the complete TypeScript source and tests, the build configuration,
`package.json`, and `package-lock.json`.
