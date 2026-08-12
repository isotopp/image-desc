# Image Description

A rights-minimal Firefox extension scaffold for creating accessible descriptions
of images. The initial interface accepts an image only when the user explicitly
pastes it into the extension sidebar.

## Load from disk

1. Open `about:debugging` in Firefox.
2. Select **This Firefox**.
3. Select **Load Temporary Add-on**.
4. Choose this repository's `manifest.json`.
5. Use the extension toolbar button to open the sidebar.

The temporary installation lasts until Firefox restarts. At this scaffold stage,
the extension previews a pasted image but deliberately makes no network request.

## Security baseline

- No page or tab access.
- No persistent clipboard read or write permissions.
- No image processing without an explicit paste gesture.
- No remote data transmission until a provider and consent flow are implemented.
