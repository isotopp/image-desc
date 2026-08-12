# Epic: Rights-minimal image descriptions for Firefox

## Outcome

Enable a blind or visually impaired Firefox user to obtain a useful textual
description of an image while granting the extension the least authority needed.
The primary workflow uses Firefox's native **Copy Image** command followed by an
explicit paste into an extension-owned sidebar. The extension must not inspect
pages or the clipboard continuously.

## Product and security principles

- Processing begins only after an unambiguous user action.
- The initial solution requests no access to browsing data, tabs, page content,
  cookies, history, or persistent clipboard contents.
- The sidebar is fully keyboard- and screen-reader-operable.
- Image transmission is opt-in, narrowly scoped, and clearly disclosed.
- Pasted image data and generated descriptions are ephemeral by default.
- Convenience features may not silently weaken the baseline permissions model.

## Story 1 — Load and open the local extension

**As a** developer or tester
**I want** to load the unpacked extension from disk and open its sidebar
**So that** I can exercise the workflow without publishing the extension.

### Acceptance criteria

- Firefox accepts `manifest.json` through `about:debugging`.
- Activating the toolbar action opens an extension-owned sidebar.
- The manifest declares no page, tab, clipboard, history, cookie, or broad host
  permissions.
- Firefox reports that the scaffold collects or transmits no data.

## Story 2 — Paste an explicitly copied image

**As a** privacy-conscious user
**I want** to paste an image into the sidebar
**So that** the extension receives only the image I deliberately provide.

### Acceptance criteria

- The paste target is reachable and identifiable using a screen reader.
- Ctrl+V and Command+V accept common image clipboard data through the paste event.
- Text or unsupported clipboard data produces an accessible error.
- The extension does not request `clipboardRead`.
- The pasted image is previewed and can be removed.
- Temporary object URLs are revoked when the image is replaced or removed.

## Story 3 — Configure a description provider safely

**As a** user
**I want** to choose and configure an image-description provider
**So that** I control where my image is processed.

### Acceptance criteria

- No remote provider is enabled by default.
- The settings explain whether processing is local or remote.
- A remote provider requires affirmative consent before the first transmission.
- Remote access is restricted to the exact configured service origin rather than
  a broad host pattern.
- A shared service secret is never embedded in the extension package.
- Credentials are not written to logs or included in generated diagnostics.

## Story 4 — Request an accessible image description

**As a** blind or visually impaired user
**I want** the selected image described clearly
**So that** I can understand its meaningful visual content.

### Acceptance criteria

- A request contains the pasted image and a narrowly defined accessibility prompt.
- The UI announces when processing starts and finishes using a polite live region.
- Controls remain keyboard-operable while a request is active.
- The provider receives no page URL, cookies, browsing history, or surrounding page
  text unless a later story explicitly introduces and discloses that context.
- The result distinguishes observable content from uncertain interpretation.
- Failures produce actionable, screen-reader-accessible messages.

## Story 5 — Review and copy the description

**As a** user
**I want** to review and explicitly copy the generated description
**So that** I can use it in another application.

### Acceptance criteria

- The complete description appears as selectable, ordinary text in the sidebar.
- Focus can move directly to the result without unexpected focus stealing.
- An explicit **Copy description** button uses a transient user gesture.
- The extension does not request persistent `clipboardWrite` access.
- Copy success or failure is announced without automatically speaking over the
  user's screen reader.

## Story 6 — Clear sensitive working data

**As a** user
**I want** to remove the current image and description
**So that** sensitive content does not remain unnecessarily available.

### Acceptance criteria

- A single action removes the preview, description, and in-memory image data.
- Closing or reloading the sidebar does not restore the previous image by default.
- Images and descriptions are not written to local storage or analytics.
- The sidebar returns focus to the paste target after clearing.

## Story 7 — Offer right-click convenience as an optional enhancement

**As a** user who prioritizes speed
**I want** an optional **Describe this image** context-menu action
**So that** I can avoid copying and pasting when I accept temporary page access.

### Acceptance criteria

- The paste workflow remains usable without enabling this feature.
- Enabling it requests only `menus`, `activeTab`, and the minimum scripting access.
- It acts only on the image and tab selected by the user's context-menu action.
- It does not introduce `<all_urls>`, persistent content scripts, or background page
  inspection.
- The options UI explains the additional access before it is enabled.

## Initial non-goals

- Automatically scanning or describing every image on a page.
- Replacing website alt text or modifying page content.
- Reading the clipboard in the background.
- Retaining an image-description history.
- Automatically copying results without a user gesture.
- Sending page context or identity data to an image-description provider.
