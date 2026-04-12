import type { ExportFormatDefinition } from "@anvilkit/core/types";

import type { HtmlExportOptions } from "./types.js";

export const htmlFormat: ExportFormatDefinition<HtmlExportOptions> = {
	id: "html",
	label: "HTML",
	extension: "html",
	mimeType: "text/html",
	run: async (_ir, _options) => ({
		content: "<!-- stub -->",
		filename: "page.html",
		warnings: [],
	}),
};
