import type {
  ExportFormatDefinition,
  IRAssetResolver,
} from "@anvilkit/core/types";

import { emitCss } from "../emit/emit-css.js";
import { emitHtml, makeEmitContext } from "../emit/emit-html.js";
import { inlineAssets } from "../asset/inline-assets.js";
import { resolveHtmlAssetUrls } from "../asset/resolve-assets.js";
import { substituteAssets } from "../asset/substitute-assets.js";
import type { HtmlExportOptions } from "../types/types.js";
import { wrapDocument } from "../document/wrap-document.js";

export const htmlFormat: ExportFormatDefinition<HtmlExportOptions> = {
  id: "html",
  label: "HTML",
  extension: "html",
  mimeType: "text/html",
  run: async (ir, options, runCtx) => {
    const mergedResolvers: readonly IRAssetResolver[] = [
      ...(runCtx?.assetResolvers ?? []),
      ...(options.assetResolvers ?? []),
    ];
    const { ir: resolvedIr, warnings: resolutionWarnings } =
      await resolveHtmlAssetUrls(ir, mergedResolvers);
    const ctx = makeEmitContext();
    const {
      html,
      usedClassnames,
      warnings: htmlWarnings,
      emittedAssetIds,
    } = emitHtml(resolvedIr, options, ctx);
    const { inlined, warnings: assetWarnings } = await inlineAssets(
      resolvedIr.assets,
      {
        thresholdBytes: options.inlineAssetThresholdBytes ?? 32_768,
        ...(options.fetchAsset ? { fetchAsset: options.fetchAsset } : {}),
        emittedAssetIds,
      },
    );
    const css = emitCss(usedClassnames, options);
    const title = options.title ?? resolvedIr.metadata.title ?? "Exported Page";
    const description = resolvedIr.metadata.description;
    const lang = options.lang;
    const bodyHtml = substituteAssets(html, inlined);
    const content = wrapDocument({ title, css, bodyHtml, lang, description });

    return {
      content,
      filename: "page.html",
      warnings: [...resolutionWarnings, ...htmlWarnings, ...assetWarnings],
    };
  },
};
