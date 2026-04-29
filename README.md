# @anvilkit/plugin-export-html

HTML export plugin for Anvilkit Studio. `@anvilkit/plugin-export-html`
registers the first real Phase 3 export format, turning `PageIR`
documents into standalone HTML with emitted CSS, optional asset
inlining, and an opt-in Studio header action for interactive export
flows when the host supplies a `buildIR` callback.

> **Alpha status (0.1.x).** The package surface is implemented and
> tested, but the emitted HTML/CSS contract may still evolve before
> `0.1.0`.

## Install

```bash
pnpm add @anvilkit/plugin-export-html @anvilkit/core react react-dom @puckeditor/core
```

## Quickstart

```ts
import { Studio } from "@anvilkit/core";
import { puckDataToIR } from "@anvilkit/ir";
import { createHtmlExportPlugin } from "@anvilkit/plugin-export-html";
import { puckConfig } from "./puck-config";

const htmlExport = createHtmlExportPlugin({
  title: "Marketing page",
  lang: "en",
  inlineAssetThresholdBytes: 32_768,
  // Required for the "Download HTML" header action. When supplied, the
  // action runs the export end-to-end and emits `anvilkit:export:ready`
  // with the resulting payload.
  buildIR: (ctx) => puckDataToIR(ctx.getData(), puckConfig),
});

<Studio puckConfig={puckConfig} plugins={[htmlExport]} />;
```

Options passed to `createHtmlExportPlugin()` are used as defaults for
every export run; host calls to `exportAs("html", { … })` shallow-merge
on top. Remote asset inlining is host-controlled: pass `fetchAsset` (or
wrap `defaultFetchAsset` from the `inline-assets` subpath) to opt into
fetching asset bytes. Without a fetcher, matching images stay as URLs.

By default, `createHtmlExportPlugin()` contributes the "Download HTML"
header action only when `buildIR` is supplied. Hosts that intentionally
handle `anvilkit:export:request` themselves can pass `headerAction: true`
without `buildIR` to expose the request-only action.

## Public API

| Export | Purpose |
| ------ | ------- |
| `createHtmlExportPlugin` | Register the HTML export format and, when configured, its header action with `@anvilkit/core`. Options passed here become run-time defaults. |
| `htmlFormat` | Direct `ExportFormatDefinition` for headless export pipelines and tests. |
| `createExportHtmlHeaderAction` | Build a header action bound to a configured format and options. Used internally by `createHtmlExportPlugin`. |
| `exportHtmlHeaderAction` | Default unbound header action; emits an `anvilkit:export:request` event for hosts to handle. |
| `HtmlExportOptions` | Configure document title, language, host-controlled asset inlining, custom asset fetchers, header-action behavior, and an optional `buildIR` callback. |
| `FetchAssetFn` | Host-supplied async asset loader used when inlining external assets. |
| `IRBuilder` | Callback signature for the `buildIR` option — receives the live plugin context and returns a `PageIR`. |

## Phase 3 references

See the [Phase 3 plan](../../../docs/plans/phase-3-export-ai-pipeline-plan.md)
(`M4 — @anvilkit/plugin-export-html`) and the
[architecture package catalog](../../../docs/ai-context/anvilkit-architecture.md)
(`§7 — @anvilkit/plugins [Stubs Exist]`) for the export-plugin role and
Phase 3 dependency layering.

## Peer dependencies

| Package | Version |
| ------- | ------- |
| `react` | `^18.2.0 || ^19.0.0` |
| `react-dom` | `^18.2.0 || ^19.0.0` |
| `@puckeditor/core` | `^0.21.0` |
