# Image Description contributor guide

## Project architecture

This repository builds a Firefox WebExtension with TypeScript and Vite. The
extension-owned sidebar is the primary UI. The background entry point owns only
browser action wiring; provider transport and sidebar behavior are separate public
boundaries so they can be tested through observable behavior.

The primary input path is an explicit image paste event in the sidebar. The optional
context-menu path is implemented later and must remain opt-in. Images, manual context,
and descriptions are transient working data. Provider configuration is the only data
that may be persisted, using `browser.storage.local`.

## Development commands

Use Node.js 22 LTS or another version in the range declared by `package.json`.

```text
npm install
npm run test
npm run lint
npm run typecheck
npm run format:check
npm run build
npm run package
npm run source-package
```

Run one focused Vitest file with `npx vitest run path/to/test.ts`. Use `npm run
format` when intentionally applying Prettier changes. `npm run source-package`
requires a clean Git worktree so the reviewer archive corresponds exactly to a
commit.

## Testing expectations

Use vertical red–green–refactor cycles. Add one behavior test, observe it fail, add
the minimum implementation, observe it pass, and refactor only while green. Tests
must exercise public interfaces, rendered UI, browser-extension boundaries, or
observable HTTP requests. Do not assert private function names, internal call order,
or incidental DOM structure.

## Conventions

- Keep browser permissions at the smallest scope required by the active ticket.
- Keep provider configuration provider-neutral and compatible with the Responses API.
- Keep image and description data out of persistent storage and diagnostics.
- Keep credentials out of source, logs, error messages, and committed fixtures.
- Update `README.md` when commands or user-visible behavior change.
- Preserve unrelated user changes in the working tree.

## Agent guardrails

- Do not add page, tab, clipboard, history, cookie, or broad host permissions without
  an explicit ticket and a permission-contract test.
- Do not log image data, manual context, descriptions, API keys, authorization headers,
  or raw provider responses.
- Justify every new dependency in the ticket implementation and avoid dependencies
  that expand runtime authority without a clear need.
- Run `npm run test`, `npm run lint`, `npm run typecheck`, `npm run format:check`, and
  `npm run build` before declaring a ticket complete.
- Commit one completed ticket before beginning the next ticket.
- Preserve unrelated user changes and do not use destructive repository commands.
