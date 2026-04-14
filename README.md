# @anvilkit/plugin-export-html

HTML export plugin for Anvilkit Studio. `@anvilkit/plugin-export-html`
registers the first real Phase 3 export format, turning `PageIR`
documents into standalone HTML with emitted CSS, optional asset
inlining, and a matching Studio header action for interactive export
flows.

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
import { createHtmlExportPlugin } from "@anvilkit/plugin-export-html";
import { puckConfig } from "./puck-config";

const htmlExport = createHtmlExportPlugin({
  title: "Marketing page",
  inlineStyles: true,
  inlineAssetThresholdBytes: 32_768,
});

<Studio puckConfig={puckConfig} plugins={[htmlExport]} />;
```

## Public API

| Export | Purpose |
| ------ | ------- |
| `createHtmlExportPlugin` | Register the HTML export format and its header action with `@anvilkit/core`. |
| `htmlFormat` | Direct `ExportFormatDefinition` for headless export pipelines and tests. |
| `exportHtmlHeaderAction` | Studio header action that exposes the HTML export affordance in host UIs. |
| `HtmlExportOptions` | Configure document title, asset inlining, inline styles, and custom asset fetchers. |
| `FetchAssetFn` | Host-supplied async asset loader used when inlining external assets. |

## Phase 3 references

See the [Phase 3 plan](../../../docs/plans/phase-3-export-ai-pipeline-plan.md)
(`M4 — @anvilkit/plugin-export-html`) and the
[architecture package catalog](../../../docs/ai-context/anvilkit-architecture.md)
(`§7 — @anvilkit/plugins [Stubs Exist]`) for the export-plugin role and
Phase 3 dependency layering.

## Peer dependencies

| Package | Version |
| ------- | ------- |
| `react` | `^18.2.0` |
| `react-dom` | `^18.2.0` |
| `@puckeditor/core` | `^0.19.0` |
