# @anvilkit/plugin-export-html

HTML export format package for Anvilkit Studio.

## Status

`0.1.0-alpha.0` scaffold only. This package currently registers a stub HTML export format and returns a placeholder HTML document.

## Quickstart

```ts
import { createHtmlExportPlugin } from "@anvilkit/plugin-export-html";

const htmlPlugin = createHtmlExportPlugin();
```

Use the returned plugin in your Studio plugin list. It contributes a single export format with id `"html"`.

## Roadmap

Real HTML emitters and option threading land in `phase3-010`.
