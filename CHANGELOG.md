# @anvilkit/plugin-export-html

## 0.1.0-alpha.0 — 2026-04-14

### Added

- **Plugin surface** — `createHtmlExportPlugin`, `htmlFormat`, and
  `exportHtmlHeaderAction` as the public HTML export integration
  points for `@anvilkit/core`.
- **Types** — `HtmlExportOptions` and `FetchAssetFn` for configuring
  inline styles, asset inlining, document title, and host-provided
  asset fetching.
- **Quality gates** — `check:publint`, `check:circular`,
  `check:peer-deps`, `check:bundle-budget` (6 KB gzipped limit),
  and `check:api-snapshot`.

### Notes

- **Alpha release.** The HTML and CSS output contract may still
  evolve across `0.1.0-alpha.x` releases; consumers should pin
  exact versions.
- **Standalone-document focus.** The current surface is optimized for
  emitting a single HTML document with optional asset inlining rather
  than a multi-file site export pipeline.
