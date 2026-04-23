import type { ExportFormatDefinition } from "@anvilkit/core/types";

import { emitCss } from "./emit-css.js";
import { emitHtml, makeEmitContext } from "./emit-html.js";
import { defaultFetchAsset, inlineAssets } from "./inline-assets.js";
import { resolveHtmlAssetUrls } from "./resolve-assets.js";
import { substituteAssets } from "./substitute-assets.js";
import type { HtmlExportOptions } from "./types.js";
import { wrapDocument } from "./wrap-document.js";

export const htmlFormat: ExportFormatDefinition<HtmlExportOptions> = {
	id: "html",
	label: "HTML",
	extension: "html",
	mimeType: "text/html",
	run: async (ir, options, runCtx) => {
		const {
			ir: resolvedIr,
			warnings: resolutionWarnings,
		} = await resolveHtmlAssetUrls(ir, runCtx?.assetResolvers ?? []);
		const ctx = makeEmitContext();
		const {
			html,
			usedClassnames,
			warnings: htmlWarnings,
		} = emitHtml(resolvedIr, options, ctx);
		const { inlined, warnings: assetWarnings } = await inlineAssets(
			resolvedIr.assets,
			{
			thresholdBytes: options.inlineAssetThresholdBytes ?? 32_768,
			fetchAsset: options.fetchAsset ?? defaultFetchAsset,
			},
		);
		const css = emitCss(usedClassnames, options);
		const title = options.title ?? "Exported Page";
		const bodyHtml = substituteAssets(html, inlined);
		const content = wrapDocument({ title, css, bodyHtml });

		return {
			content,
			filename: "page.html",
			warnings: [
				...resolutionWarnings,
				...htmlWarnings,
				...assetWarnings,
			],
		};
	},
};
