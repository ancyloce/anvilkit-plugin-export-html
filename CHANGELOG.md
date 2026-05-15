# @anvilkit/plugin-export-html

## 0.1.2

### Patch Changes

- Updated dependencies
  - @anvilkit/core@0.1.2

## 0.1.1

### Patch Changes

- Routine `0.1.1` patch — coordinated fixed-group bump.

  Aligns the lockstep fixed group at `0.1.1`. Additive only; no breaking
  changes. New surface area in this cut:
  - Section-level AI regeneration (`regenerateSelection`) via
    `@anvilkit/plugin-ai-copilot`, with a reusable `<AiPromptPanel>` in
    `@anvilkit/ui`.
  - `PageIRNode.meta` (locked / owner / notes / version) with diff/apply
    parity across `@anvilkit/ir`, `@anvilkit/schema`, `@anvilkit/validator`,
    and `@anvilkit/plugin-version-history`.
  - Realtime collab integration points (host plugins remain alpha).
  - Marketplace registry feed under the docs site.

- Updated dependencies
  - @anvilkit/core@0.1.1

## 0.1.0-alpha.0 — 2026-04-14

### Added

- **Plugin surface** — `createHtmlExportPlugin`, `htmlFormat`, and
  `exportHtmlHeaderAction` as the public HTML export integration
  points for `@anvilkit/core`.
- **Types** — `HtmlExportOptions` and `FetchAssetFn` for configuring
  inline styles, asset inlining, document title, and host-provided
  asset fetching.
- **Quality gates** — `check:publint`, `check:circular`,
  `check:peer-deps`, `check:bundle-budget` (15 KB gzipped, kept in
  sync with `.size-limit.json`), and `check:api-snapshot`.

### Notes

- **Alpha release.** The HTML and CSS output contract may still
  evolve across `0.1.0-alpha.x` releases; consumers should pin
  exact versions.
- **Standalone-document focus.** The current surface is optimized for
  emitting a single HTML document with optional asset inlining rather
  than a multi-file site export pipeline.
- **Host-controlled inlining.** Remote asset fetching is opt-in through
  `fetchAsset`; exports without a fetcher preserve asset URLs rather
  than performing implicit network requests.
- **Header action gating.** `createHtmlExportPlugin()` only contributes
  the download header action by default when `buildIR` is supplied. Pass
  `headerAction: true` to expose the request-only event path.
