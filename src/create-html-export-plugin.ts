import type { StudioPlugin, StudioPluginMeta } from "@anvilkit/core/types";

import { htmlFormat } from "./format-definition.js";
import type { HtmlExportOptions } from "./types.js";

const htmlExportPluginMeta: StudioPluginMeta = {
	id: "anvilkit-plugin-export-html",
	name: "HTML Export",
	version: "0.1.0-alpha.0",
	coreVersion: "^0.1.0-alpha",
	description: "Export Puck pages as standalone HTML documents.",
};

export function createHtmlExportPlugin(
	_opts?: HtmlExportOptions,
): StudioPlugin {
	return {
		meta: htmlExportPluginMeta,
		register(_ctx) {
			return {
				meta: htmlExportPluginMeta,
				exportFormats: [htmlFormat],
			};
		},
	};
}
