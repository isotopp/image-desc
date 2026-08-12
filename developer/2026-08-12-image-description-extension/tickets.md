# Implementation tickets: Rights-minimal image descriptions for Firefox

This implementation chain derives from [user-stories.md](./user-stories.md). Complete
tickets in numerical order unless a ticket explicitly states otherwise.

## TDD working agreement

For every behavior ticket:

1. Add one test for the next observable behavior and run it to confirm **RED**.
2. Add only the implementation required for that test and run it to confirm
   **GREEN**.
3. Repeat red–green for the next listed behavior; do not write all ticket tests in
   advance.
4. Refactor only while green, rerunning the focused test and then the full suite.

Tests use public interfaces, rendered UI, browser-extension boundaries, or observable
HTTP requests. They do not assert private function names, internal call order, or DOM
structure beyond labels, controls, visible state, and other user-observable behavior.

Unless a ticket narrows the requirement, it is done when:

- its listed behavior and acceptance criteria are satisfied;
- each new test was observed failing before its implementation was added;
- `npm run test`, `npm run lint`, `npm run typecheck`, and
  `npm run format:check` pass;
- `npm run build` succeeds; and
- unrelated behavior and permissions remain unchanged.

## Ticket 1 — Bootstrap the TypeScript test and build environment

- **Source:** Story 3
- **Depends on:** none

### Outcome

The repository has an npm-managed TypeScript, Vite, and Vitest baseline on which all
later red–green cycles can run.

### TDD cycle

- **RED:** Add one smoke test importing a trivial public TypeScript module; confirm it
  cannot run with the current repository.
- **GREEN:** Add `package.json`, the npm lockfile, TypeScript configuration, Vite,
  Vitest, and the minimal module needed to make that test pass.
- **REFACTOR:** Separate build and test TypeScript configuration only if the working
  setup demonstrates that it is needed.

### Acceptance criteria

- npm is the package manager and the lockfile is committed.
- The supported Node.js LTS release is documented in `package.json` and the README.
- `npm test` runs Vitest successfully.
- `npm run build` runs Vite successfully.
- Generated output and dependencies remain ignored.

## Ticket 2 — Build the existing extension from TypeScript sources

- **Source:** Stories 1 and 3
- **Depends on:** Ticket 1

### Outcome

Vite produces an unpacked Firefox extension containing the existing sidebar and
toolbar-opening behavior, with application JavaScript migrated to TypeScript.

### TDD cycle

- **RED:** Add a build-output test asserting that a production build contains a
  manifest, background entry point, and sidebar page referenced by that manifest.
- **GREEN:** Move the application entry points to TypeScript and configure Vite to
  emit the required extension files.
- **REFACTOR:** Remove obsolete source files and duplicated build configuration while
  the output test remains green.

### Acceptance criteria

- Application code is TypeScript.
- The production build contains no missing manifest entry points.
- Firefox can load the build directory through `about:debugging`.
- Activating the toolbar action opens the extension-owned sidebar.

## Ticket 3 — Add quality checks, packaging, and contributor guardrails

- **Source:** Story 3
- **Depends on:** Ticket 2

### Outcome

One documented command set validates, formats, tests, builds, and packages the
extension consistently.

### TDD cycle

- **RED:** Add a validation test that fails because the required package scripts and
  contributor guardrail headings do not yet exist.
- **GREEN:** Configure ESLint, Prettier, no-emit TypeScript checking, and `web-ext`;
  add the required scripts and `AGENTS.md` content.
- **REFACTOR:** Consolidate shared file globs and ignores without weakening any check.

### Acceptance criteria

- Package scripts include `build`, `test`, `lint`, `format`, `format:check`,
  `typecheck`, and `package`.
- `web-ext` validates and packages the built extension.
- `AGENTS.md` documents architecture, commands, testing expectations, and project
  conventions.
- The final `AGENTS.md` section is **Agent guardrails** and contains every guardrail
  required by Story 3.

## Ticket 4 — Lock the baseline manifest permission budget

- **Source:** Story 1
- **Depends on:** Ticket 3

### Outcome

Automated checks prevent accidental addition of prohibited persistent browser
permissions.

### TDD cycle

- **RED:** Add one manifest-contract test that rejects `clipboardRead`,
  `clipboardWrite`, page, tab, history, cookie, and required broad host permissions.
- **GREEN:** Make the generated manifest satisfy the contract and accurately declare
  potential image transmission.
- **REFACTOR:** Expose a small manifest reader for later permission-contract tests if
  that reduces duplication.

### Acceptance criteria

- The manifest contract test passes against the actual build input or generated
  manifest.
- Optional provider-origin permissions and the optional context-menu permissions are
  distinguishable from required permissions.
- No application feature is granted page or clipboard access at startup.

## Ticket 5 — Paste an image and display its preview

- **Source:** Story 4
- **Depends on:** Ticket 4

### Outcome

A user can paste one clipboard image into the sidebar and see that it was accepted.

### TDD cycle

- **RED:** Through the rendered sidebar, paste an image clipboard item and assert
  that a preview becomes visible.
- **GREEN:** Implement the paste target and the minimum image-preview state.
- **REFACTOR:** Extract paste-item interpretation only if it makes the public sidebar
  behavior simpler to maintain.

### Acceptance criteria

- The paste target is clearly labelled and keyboard reachable.
- Image data is accepted only through the user's paste event.
- A preview is shown for the pasted image.
- The manifest still lacks `clipboardRead`.

## Ticket 6 — Reject clipboard content without an image

- **Source:** Story 4
- **Depends on:** Ticket 5

### Outcome

Unsupported clipboard content produces a clear error without disturbing the current
valid image.

### TDD cycles

1. **RED → GREEN:** Paste text into an empty sidebar and show a clear inline error.
2. **RED → GREEN:** Paste unsupported content while an image is present and preserve
   the existing preview.
3. **REFACTOR:** Unify error-state rendering while all paste behavior stays green.

### Acceptance criteria

- Text and unsupported clipboard items are rejected.
- The inline error is visible and does not replace a previously accepted image.

## Ticket 7 — Remove and replace the pasted image

- **Source:** Story 4
- **Depends on:** Ticket 6

### Outcome

The user can replace or remove the working image without retaining obsolete object
URLs.

### TDD cycles

1. **RED → GREEN:** Paste a second image and show only the replacement preview.
2. **RED → GREEN:** Remove the current image and return to the empty paste state.
3. **RED → GREEN:** Observe through the URL boundary that replaced and removed object
   URLs are revoked.
4. **REFACTOR:** Centralize working-image cleanup while green.

### Acceptance criteria

- Replacing an image revokes the old preview URL.
- Removing an image revokes its preview URL.
- No image bytes are written to extension storage.

## Ticket 8 — Capture optional manual context as transient working state

- **Source:** Story 4
- **Depends on:** Ticket 7

### Outcome

The sidebar accepts optional context that accompanies only the current description
request.

### TDD cycles

1. **RED → GREEN:** Enter manual context and expose it with the current working image
   through the sidebar's public submission behavior.
2. **RED → GREEN:** Reload a fresh sidebar instance and observe an empty image,
   context, and description state.
3. **REFACTOR:** Keep transient working state behind one small sidebar state boundary.

### Acceptance criteria

- The context input is clearly labelled and keyboard reachable.
- Context is not stored in `browser.storage.local` or another persistent store.
- A new sidebar instance starts without the previous image, context, or description.

## Ticket 9 — Save and restore provider configuration

- **Source:** Story 5
- **Depends on:** Ticket 8

### Outcome

An options page saves and restores the provider base URL, model, authentication mode,
and API key.

### TDD cycles

1. **RED → GREEN:** Save a complete provider configuration through the rendered
   options page and restore it in a fresh options-page instance.
2. **RED → GREEN:** Switch between no authentication and bearer authentication while
   preserving independently entered values.
3. **REFACTOR:** Place persistence behind a small configuration-store interface.

### Acceptance criteria

- Configuration uses `browser.storage.local`.
- All four independently configurable fields round-trip without provider-specific
  behavior.
- Credentials are never logged or included in diagnostics.
- The extension package contains no shared service credential.

## Ticket 10 — Enforce provider URL transport rules

- **Source:** Story 5
- **Depends on:** Ticket 9

### Outcome

Provider configuration accepts HTTPS generally and plain HTTP only on explicit
loopback hostnames.

### TDD cycles

1. **RED → GREEN:** Accept an HTTPS base URL.
2. **RED → GREEN:** Accept HTTP for `localhost`, `127.0.0.1`, and `[::1]`, one case at
   a time.
3. **RED → GREEN:** Reject non-loopback HTTP with a clear inline error.
4. **REFACTOR:** Keep URL validation as a public, result-returning module used by the
   options page.

### Acceptance criteria

- Invalid URLs are not saved or activated.
- No endpoint discovery, capability probe, or local-network scan occurs.
- Provider and model availability remain unchecked until a real description request.

## Ticket 11 — Request host access when activating a provider

- **Source:** Story 5
- **Depends on:** Ticket 10

### Outcome

Saving valid provider settings activates them only after Firefox grants access to the
configured origin.

### TDD cycles

1. **RED → GREEN:** Grant an exact-origin permission request and activate the saved
   provider.
2. **RED → GREEN:** Deny the permission request, show an inline error, and leave the
   previous provider active.
3. **REFACTOR:** Place Firefox permission access behind a narrow origin-permission
   boundary.

### Acceptance criteria

- Permission is requested only from the explicit save action.
- The requested origin is derived from the validated base URL.
- Denial does not partially activate the rejected configuration.
- No request uses an origin that has not been granted.

## Ticket 12 — Revoke obsolete provider-origin access

- **Source:** Story 5
- **Depends on:** Ticket 11

### Outcome

Replacing or removing a provider releases origin access that the active configuration
no longer needs.

### TDD cycles

1. **RED → GREEN:** Replace a provider and request revocation of its obsolete origin
   after the replacement is successfully activated.
2. **RED → GREEN:** Remove the active provider and request revocation of its origin.
3. **RED → GREEN:** If Firefox cannot revoke the permission, preserve the correct
   configuration state and show a non-blocking status.

### Acceptance criteria

- A failed replacement never revokes access needed by the active provider.
- Revocation failure does not corrupt the saved configuration.

## Ticket 13 — Send the first one-shot Responses API image request

- **Source:** Stories 5 and 6
- **Depends on:** Ticket 12

### Outcome

`DescriptionProvider.describe()` sends one pasted image to
`<base URL>/v1/responses` and returns the resulting description.

### TDD cycle

- **RED:** Through the public provider interface and a controlled HTTP transport,
  describe an image and assert the returned text plus the observable HTTP request.
- **GREEN:** Implement the minimum Responses API transport for no authentication.
- **REFACTOR:** Separate request serialization and response extraction only after the
  end-to-end provider test is green.

### Acceptance criteria

- The request includes the configured model.
- The image is sent as a Base64 data URL in an `input_image` item.
- The text input is exactly
  `Provide an image description for the visually impaired that fits into 1300 characters or less.`
- The request contains no conversation state, `previous_response_id`, page URL,
  cookies, browsing history, or surrounding page text.
- The returned description is obtained from a successful Responses API response.

## Ticket 14 — Apply the configured authentication mode

- **Source:** Story 5
- **Depends on:** Ticket 13

### Outcome

The same provider transport works with no authentication or a configured bearer
token, without identifying OpenAI or LM Studio in code.

### TDD cycles

1. **RED → GREEN:** With bearer authentication selected, send the configured API key
   in the Authorization header.
2. **RED → GREEN:** With no authentication selected, omit the Authorization header
   even when the independently stored API-key field contains a value.
3. **REFACTOR:** Keep authentication header creation provider-neutral.

### Acceptance criteria

- No provider-specific branch exists for OpenAI or LM Studio authentication.
- API keys never appear in error text or logs.

## Ticket 15 — Append non-empty manual context to the prompt

- **Source:** Stories 4 and 6
- **Depends on:** Ticket 14

### Outcome

User context is included in the one-shot request only when it contains non-whitespace
text.

### TDD cycles

1. **RED → GREEN:** Describe with manual context and append a blank line followed by
   `The user provides the following additional context: ` and the trimmed context.
2. **RED → GREEN:** Describe with whitespace-only context and retain the base prompt
   unchanged.
3. **REFACTOR:** Expose prompt construction as one deterministic public contract if
   this clarifies the provider interface.

### Acceptance criteria

- The context is part of `input_text`, not a conversation history item.
- The request remains independent and contains no `previous_response_id`.

## Ticket 16 — Report Responses API and transport failures

- **Source:** Stories 5 and 6
- **Depends on:** Ticket 15

### Outcome

The provider returns safe, actionable failures for network errors, non-success HTTP
responses, and malformed success responses.

### TDD cycles

1. **RED → GREEN:** Convert a failed network request into a typed provider failure.
2. **RED → GREEN:** Convert a non-success HTTP response into a failure without
   exposing credentials.
3. **RED → GREEN:** Reject a success response with no usable description.
4. **REFACTOR:** Normalize external errors behind the public provider error contract.

### Acceptance criteria

- Provider or model incompatibility is reported from the real failed request.
- Error text contains neither the API key nor image bytes.
- No preflight capability request is introduced.

## Ticket 17 — Generate and display a description from the sidebar

- **Source:** Stories 6 and 7
- **Depends on:** Ticket 16

### Outcome

The core paste-to-description tracer bullet works through the rendered sidebar using
the public `DescriptionProvider` boundary.

### TDD cycle

- **RED:** Paste an image, activate **Describe**, complete an in-memory provider with
  description text, and assert visible progress followed by the visible result.
- **GREEN:** Connect sidebar submission state to an injected `DescriptionProvider`.
- **REFACTOR:** Keep provider construction in the extension composition root, not in
  sidebar behavior.

### Acceptance criteria

- **Describe** is available only when an image and active provider exist.
- Processing state is visible while the request is pending.
- The complete returned description appears as selectable ordinary text.
- The result can be reached quickly with the keyboard.

## Ticket 18 — Prevent concurrent description requests

- **Source:** Story 6
- **Depends on:** Ticket 17

### Outcome

Only one description request can be active in a sidebar instance.

### TDD cycle

- **RED:** Start a pending request and attempt to start another; observe a disabled
  **Describe** action and only one request crossing the public provider boundary.
- **GREEN:** Add the minimum active-request state needed to block duplicates.
- **REFACTOR:** Keep active-request ownership in one place.

### Acceptance criteria

- **Describe** is disabled from submission until completion, failure, cancellation,
  or timeout.
- Replacing the current request is impossible without ending it first.

## Ticket 19 — Cancel an active request

- **Source:** Story 6
- **Depends on:** Ticket 18

### Outcome

The user can cancel processing while retaining the image and manual context for a
later retry.

### TDD cycle

- **RED:** Start a signal-aware pending provider, activate **Cancel**, and observe an
  aborted request, **Canceled** status, preserved inputs, and re-enabled
  **Describe**.
- **GREEN:** Connect the cancel control to the request's `AbortSignal`.
- **REFACTOR:** Centralize terminal request-state cleanup while green.

### Acceptance criteria

- Cancel is available only while a request is active.
- A late result from a canceled request cannot replace current sidebar state.

## Ticket 20 — Time out an active request after 120 seconds

- **Source:** Story 6
- **Depends on:** Ticket 19

### Outcome

A stalled provider cannot leave the sidebar permanently busy.

### TDD cycle

- **RED:** Start a pending request, advance controlled time to 120 seconds, and
  observe an aborted request, timeout status, and re-enabled **Describe**.
- **GREEN:** Add the 120-second timeout to the active request lifecycle.
- **REFACTOR:** Share abort cleanup with explicit cancellation without conflating
  their user-visible statuses.

### Acceptance criteria

- The timeout is measured per request.
- Explicit cancellation shows **Canceled**; elapsed timeout shows a timeout error.
- Image and manual context remain available after timeout.

## Ticket 21 — Recover the sidebar after provider failure

- **Source:** Story 6
- **Depends on:** Ticket 20

### Outcome

Provider and network failures appear inline and leave the current image ready for a
retry.

### TDD cycle

- **RED:** Submit through a provider that returns a safe public failure and observe
  inline status, preserved inputs, no stale result, and re-enabled **Describe**.
- **GREEN:** Add the minimum failure-state rendering and terminal cleanup.
- **REFACTOR:** Unify completion, cancellation, timeout, and failure cleanup while
  keeping each visible outcome distinct.

### Acceptance criteria

- Failure never clears the pasted image or manual context.
- Failure never displays credentials or encoded image data.
- A retry can start immediately after failure.

## Ticket 22 — Copy the displayed description explicitly

- **Source:** Story 7
- **Depends on:** Ticket 21

### Outcome

The user can copy the current description through a direct button gesture.

### TDD cycles

1. **RED → GREEN:** Activate **Copy description** and write exactly the visible
   description through the clipboard boundary.
2. **RED → GREEN:** Show concise success status after a completed write.
3. **RED → GREEN:** Show concise failure status when the write is rejected.
4. **REFACTOR:** Keep clipboard access behind a small user-gesture boundary.

### Acceptance criteria

- The copy action is shown only when a description exists.
- The extension requests neither `clipboardWrite` nor `clipboardRead`.
- Copying never occurs automatically after generation.

## Ticket 23 — Complete user documentation and Firefox smoke tests

- **Source:** Story 2 and the TDD implementation contract
- **Depends on:** Ticket 22

### Outcome

A user can install, configure, and operate the core extension from written
instructions, and a developer can verify browser-only integration points.

### Verification cycle

- **RED:** Follow the current README and smoke-test checklist from a clean build and
  record each missing or incorrect instruction.
- **GREEN:** Update the README and checklist until every documented step succeeds.
- **REFACTOR:** Remove duplicate instructions and link to one canonical command or
  workflow description.

### Acceptance criteria

- The README covers temporary installation, production build installation, provider
  configuration, permissions, paste, context, describe, cancel, timeout, and copy.
- The smoke checklist covers sidebar opening, real Firefox paste events, provider
  origin prompts, one OpenAI-compatible request, cancellation, and clipboard writing.
- Documentation uses the current package scripts and current UI labels.

## Ticket 24 — Enable or disable the optional image context menu

- **Source:** Story 9
- **Depends on:** Ticket 23

### Outcome

The user can opt into right-click convenience after reviewing and granting its
additional Firefox permissions.

### TDD cycles

1. **RED → GREEN:** Enable the option, request only `menus`, `activeTab`, and minimum
   scripting access, then create **Describe this image** for image contexts.
2. **RED → GREEN:** Deny permission and leave the option and menu disabled.
3. **RED → GREEN:** Disable the option, remove the menu, and release optional
   permissions where Firefox permits.
4. **REFACTOR:** Keep optional-feature permission state behind one public boundary.

### Acceptance criteria

- The options page explains the additional access before enablement.
- The existing paste workflow works without these permissions.
- No `<all_urls>` or persistent content script is introduced.
- The menu appears only in Firefox image contexts.

## Ticket 25 — Describe the explicitly right-clicked image

- **Source:** Story 9
- **Depends on:** Ticket 24

### Outcome

Selecting **Describe this image** transfers only that user-selected image into the
existing one-shot description workflow.

### Browser implementation constraint

Use the context-menu event's short-lived target identity in the selected frame to
obtain the image bounds. Capture the visible tab under `activeTab`, crop the capture
to those bounds inside the extension, and discard the full-tab capture. Do not
refetch the image URL or read unrelated page content. If Firefox cannot resolve or
capture the target, take the failure path below.

### TDD cycles

1. **RED → GREEN:** Convert target bounds and capture scale into the exact local crop
   and make that crop the pending sidebar image.
2. **RED → GREEN:** Open the sidebar and run the existing description workflow with
   the pending image and optional manual context.
3. **RED → GREEN:** If Firefox cannot access or capture the selected image, show a
   clear failure and do not inspect other page content.
4. **REFACTOR:** Reuse the same working-image and request path as pasted images rather
   than creating a second provider workflow.

### Acceptance criteria

- Processing starts only from the selected context-menu action.
- Access is limited to the selected tab and selected image.
- No surrounding page text, page URL, cookies, or other images enter the request.
- Pending image data exists only in extension memory and is discarded on sidebar
  reload or close.
- The paste workflow and its permission budget remain unchanged.
- Real Firefox behavior is covered by the smoke-test checklist because context-menu
  target and active-tab behavior cannot be fully represented by a DOM test runner.

## Excluded work

Story 8 is canceled and produces no implementation ticket. All non-goals from
`user-stories.md` remain out of scope, including screen-reader optimization, image
resizing, re-encoding, sanitizing, metadata extraction, provider discovery,
capability probing, history, automatic copying, and automatic page scanning.
