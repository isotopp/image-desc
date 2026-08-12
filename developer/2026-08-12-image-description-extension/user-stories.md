# Epic: Rights-minimal image descriptions for Firefox

## Outcome

Enable a sighted social-media content creator to generate useful textual image
descriptions for blind and visually impaired readers. The primary workflow uses
Firefox's native **Copy Image** command followed by an explicit paste into an
extension-owned sidebar. The extension must not inspect pages or the clipboard
continuously.

## Product and security principles

- Processing begins only after an unambiguous user action.
- The initial solution requests no access to browsing data, tabs, page content,
  cookies, history, or persistent clipboard contents.
- The sidebar is optimized for a fast keyboard-driven workflow.
- Image transmission is limited to the image and provider explicitly selected by
  the user.
- Pasted images and generated descriptions are not persisted by default.
- Convenience features may not silently weaken the baseline permissions model.

## Implementation contracts for TDD

The implementation exposes small public TypeScript interfaces so tests exercise
observable behavior rather than private implementation details:

```typescript
type ProviderConfig = {
  baseUrl: string;
  model: string;
  authentication: "none" | "bearer";
  apiKey: string;
};

type DescriptionRequest = {
  image: Blob;
  context?: string;
  signal: AbortSignal;
};

interface DescriptionProvider {
  describe(request: DescriptionRequest): Promise<string>;
}
```

- The sidebar receives a `DescriptionProvider`; it does not construct the HTTP
  transport internally.
- Sidebar behavior is tested through its rendered DOM and user events.
- Provider behavior is tested through its public interface and observable HTTP
  contract using a controlled test transport.
- Manifest permissions are covered by static tests.
- A concise manual Firefox smoke-test checklist covers installation, sidebar opening,
  paste integration, provider permission prompts, and clipboard integration.

## Story 1 — Load and open the local extension

- **As a:** developer or tester
- **I want:** to load the unpacked extension from disk and open its sidebar
- **So that:** I can exercise the workflow without publishing the extension

### Acceptance criteria

- Firefox accepts `manifest.json` through `about:debugging`.
- Activating the toolbar action opens an extension-owned sidebar.
- The manifest declares no page, tab, clipboard, history, cookie, or required broad
  host permissions.
- Firefox's manifest accurately declares the data the extension may transmit to a
  configured description provider.

## Story 2 — Document installation and configuration

- **As a:** user
- **I want:** detailed installation and configuration instructions
- **So that:** I can run the locally installed extension without developer help

### Acceptance criteria

- `README.md` explains how to load the extension temporarily through
  `about:debugging`.
- `README.md` explains how to create a production build and load the built
  extension from disk.
- `README.md` documents provider endpoint, model identifier, authentication mode,
  and API-key configuration.
- `README.md` documents the copy-image, paste, describe, cancel, and copy-result
  workflow.
- Instructions are updated whenever configuration or user-visible behavior changes.

## Story 3 — Establish contributor tooling and guardrails

- **As a:** human or agentic developer
- **I want:** a documented and repeatable development environment
- **So that:** I can change the extension without violating its core constraints

### Acceptance criteria

- Application code is written in TypeScript.
- npm is the package manager, and its lockfile is committed.
- The supported Node.js LTS version is documented.
- Vite compiles TypeScript and creates the extension's development and production
  builds.
- Vitest runs unit tests.
- ESLint performs static analysis and Prettier enforces formatting.
- TypeScript performs a no-emit type check.
- `web-ext` validates, runs, and packages the Firefox extension.
- Package scripts provide at least `build`, `test`, `lint`, `format`, `typecheck`,
  and `package` commands.
- Dependencies and generated build artifacts are ignored.
- `AGENTS.md` documents the architecture, development commands, testing expectations,
  and conventions for humans and agents.
- The final section of `AGENTS.md` is named **Agent guardrails** and requires agents
  to preserve the permission budget, avoid logging image data or credentials,
  justify new dependencies, run the documented checks, and preserve unrelated user
  changes.

## Story 4 — Paste an explicitly copied image

- **As a:** social-media content creator
- **I want:** to paste an image into the sidebar
- **So that:** the extension receives the image I want described

### Acceptance criteria

- The paste target is reachable and clearly identified.
- Ctrl+V and Command+V accept common image clipboard data through the paste event.
- Text or unsupported clipboard data produces a clear inline error.
- The extension does not request `clipboardRead`.
- The pasted image is previewed and can be removed or replaced.
- The sidebar provides an optional manual-context input for information that cannot
  be inferred from the image alone.
- Temporary object URLs are revoked when the image is replaced or removed.
- Reloading or closing the sidebar discards the pasted image, manual context, and
  generated description.
- Images and descriptions are not persisted by default.

## Story 5 — Configure a description provider

- **As a:** user
- **I want:** to configure an OpenAI-compatible image-description provider
- **So that:** I control which endpoint and model process my image

### Acceptance criteria

- Provider configuration is edited in a Firefox extension options page.
- The base URL, model identifier, authentication mode, and API key are
  independently configurable.
- Authentication supports no authentication and bearer-token authentication without
  provider-specific special cases.
- The same provider interface supports the OpenAI API and a local LM Studio
  OpenAI-compatible API.
- LM Studio may be configured with no API key or with any accepted API-key value.
- Plain HTTP endpoints are accepted only for `localhost`, `127.0.0.1`, and `[::1]`;
  all other endpoints must use HTTPS.
- The base URL, model identifier, authentication mode, and API key are persisted in
  `browser.storage.local`; images, manual context, and descriptions are not.
- Saving a provider requests host access for that configured origin.
- If host access is denied, the provider is not activated and a clear inline error
  is shown.
- Removing or replacing a provider revokes host access that is no longer needed,
  where Firefox permits revocation.
- The extension never silently scans localhost or the local network for endpoints.
- A shared service credential is never embedded in the extension package.
- Credentials are not written to logs or included in generated diagnostics.
- Provider host access is limited to the configured origin rather than a broad
  host pattern.
- The provider uses the Responses API dialect and sends requests to
  `<base URL>/v1/responses`.
- Provider and model incompatibilities are reported from the failed request; the
  extension does not probe or pre-validate provider capabilities.

## Story 6 — Request an image description

- **As a:** social-media content creator
- **I want:** the selected image described for visually impaired readers
- **So that:** I can include the description with my post

### Acceptance criteria

- A request contains the pasted image as a Base64 data URL in a Responses API
  `input_image` item.
- With no manual context, the request uses exactly this text prompt:
  `Provide an image description for the visually impaired that fits into 1300 characters or less.`
- When trimmed manual context is non-empty, the prompt appends a blank line followed
  by `The user provides the following additional context: ` and the context text.
- Each description request is independent and does not send conversation state or a
  `previous_response_id`.
- The interface shows when processing starts and finishes.
- Keyboard controls remain available while a request is active.
- The provider receives no page URL, cookies, browsing history, or surrounding page
  text.
- The user can cancel an active request.
- Requests stop after a fixed 120-second timeout.
- At most one description request can be active at a time.
- The **Describe** action is disabled while a request is active.
- Canceling preserves the pasted image and manual context, clears the progress state,
  shows **Canceled**, and enables **Describe** again.
- Starting a replacement request requires canceling or completing the active request.
- Provider, network, timeout, and cancellation failures produce clear inline status.

## Story 7 — Review and copy the description

- **As a:** social-media content creator
- **I want:** to review and explicitly copy the generated description
- **So that:** I can include it in a social-media post

### Acceptance criteria

- The complete description appears as selectable, ordinary text in the sidebar.
- The result can be reached quickly using the keyboard.
- An explicit **Copy description** button uses a transient user gesture.
- The extension does not request persistent `clipboardWrite` access.
- Copy success or failure is shown as concise inline status.

## Story 8 — Clear sensitive working data

**Status:** Canceled — not required.

The sidebar lifecycle behavior required by the product is defined in Story 4. No
additional privacy-oriented data-clearing workflow is required because the images
and descriptions are intended for public social-media posts.

## Story 9 — Offer right-click convenience as an optional enhancement

- **As a:** user who prioritizes speed
- **I want:** an optional **Describe this image** context-menu action
- **So that:** I can avoid copying and pasting when I accept temporary page access

### Acceptance criteria

- The paste workflow remains usable without enabling this feature.
- Firefox requires the context-menu API permission in the install-time manifest;
  the menu item is still created only after opt-in, and enabling it requests only
  `activeTab` and the minimum scripting access at runtime.
- It acts only on the image and tab selected by the user's context-menu action.
- It does not introduce `<all_urls>`, persistent content scripts, or background page
  inspection.
- The options interface explains the additional access before it is enabled.

## Initial non-goals

- Automatically scanning or describing every image on a page.
- Replacing website alt text or modifying page content.
- Reading the clipboard in the background.
- Retaining an image-description history.
- Automatically copying results without a user gesture.
- Sending page context or identity data to an image-description provider.
- Optimizing the extension interface for screen-reader use.
- Pre-validating endpoint availability or model image capability.
- Resizing, re-encoding, sanitizing, or extracting metadata from pasted images.
