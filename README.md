# Image Description

A rights-minimal Firefox extension for creating descriptions of images for the
visually impaired. The core workflow accepts an image only when the user
explicitly pastes it into the extension sidebar, sends it to the provider the
user configured, and keeps the working image and result in memory only.

## Development baseline

Use Node.js 22 LTS or another supported release in the range declared by
`package.json`. Install dependencies with `npm install`, then use these commands:

```text
npm test              # Vitest suite
npm run lint          # ESLint
npm run typecheck     # TypeScript, no emitted files
npm run format:check  # Prettier verification
npm run build         # unpacked Firefox extension in ./build
npm run package       # .zip in ./web-ext-artifacts
```

`npm run format` applies Prettier when a file needs formatting.

## Load from disk

1. Open `about:debugging` in Firefox.
2. Select **This Firefox**.
3. Select **Load Temporary Add-on**.
4. Choose `build/manifest.json` after running `npm run build` (or choose the
   repository's root `manifest.json` only for the checked-in scaffold).
5. Use the extension toolbar button to open the sidebar. The toolbar action is
   the extension's only required browser interaction.

The temporary installation lasts until Firefox restarts. At this scaffold stage,
reload the temporary add-on after each build.

For a distributable local package, run `npm run package` and install the generated
zip from Firefox's Add-ons Manager. A signed release is required for permanent
installation in standard Firefox builds.

## Configure a provider

Open the extension's **Options** page and enter the provider base URL, model
identifier, authentication mode, and optional API key independently. Save the
provider before opening the sidebar. The extension requests access only to that
provider origin at save time; changing or removing the provider attempts to
release the old origin permission.

HTTPS is required except for `http://localhost`, `http://127.0.0.1`, or
`http://[::1]`. The request is sent to `<base-url>/v1/responses` using the
configured model. The prompt asks for a description for the visually impaired in
1300 characters or fewer, and appends the optional **Additional context** field.
The configured authentication mode is passed through as either no auth or a
Bearer token. This works with an OpenAI-compatible service such as a local LM
Studio server.

## Describe and copy

1. In Firefox, copy an image using the page's normal context menu.
2. Open the Image Description sidebar and focus **Paste an image here**.
3. Paste with `Ctrl`+`V` or `Command`+`V`; only that explicit paste is read.
4. Review the preview and optionally enter **Additional context**.
5. Select **Describe image**. **Cancel** is available while the request is active;
   stalled requests time out after 120 seconds.
6. Select **Copy description** only after the result is shown. Copying is never
   automatic.

Reloading or closing the sidebar discards the pasted image and generated
description. Nothing in this workflow is written to extension storage.

## Security baseline

- No required page, tab, history, cookie, or clipboard permissions.
- No persistent clipboard read or write permissions; the clipboard is touched only
  by the user's paste or copy gesture.
- Provider-origin access is optional, explicit, independently configurable, and
  HTTPS-only except for loopback development endpoints.
- Image bytes are transmitted only after the user selects **Describe image** and
  only to the configured provider. Credentials and image data are not logged.
- The optional right-click image menu is disabled unless the user enables it and
  grants its additional `menus`, `activeTab`, and `scripting` permissions.

See [the Firefox smoke-test checklist](docs/firefox-smoke-test.md) for browser-only
verification steps.
