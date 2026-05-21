import type {
	ExportFormatDefinition,
	StudioPlugin,
	StudioPluginMeta,
} from "@anvilkit/core/types";

import config from "../meta/config.json";
import packageJson from "../package.json";
import { htmlFormat } from "./format/format-definition.js";
import { createExportHtmlHeaderAction } from "./action/header-action.js";
import type { HtmlExportOptions } from "./types/types.js";

// `version` is derived from package.json so a Changesets bump can never drift
// the runtime metadata; `plugin.metadata-drift.test.ts` guards regressions.
const htmlExportPluginMeta: StudioPluginMeta = {
	...config,
	version: packageJson.version,
};

export function createHtmlExportPlugin(
	opts: HtmlExportOptions = {},
): StudioPlugin {
	const boundFormat: ExportFormatDefinition<HtmlExportOptions> = {
		id: htmlFormat.id,
		label: htmlFormat.label,
		extension: htmlFormat.extension,
		mimeType: htmlFormat.mimeType,
		run: (ir, runtimeOpts, runCtx) =>
			htmlFormat.run(ir, { ...opts, ...runtimeOpts }, runCtx),
	};
	const shouldRegisterHeaderAction =
		opts.headerAction ?? opts.buildIR !== undefined;

	return {
		meta: htmlExportPluginMeta,
		register(ctx) {
			const headerActions = shouldRegisterHeaderAction
				? [
						createExportHtmlHeaderAction(boundFormat, opts, {
							getAssetResolvers: ctx.getAssetResolvers,
						}),
					]
				: [];

			return {
				meta: htmlExportPluginMeta,
				exportFormats: [boundFormat],
				...(headerActions.length > 0 ? { headerActions } : {}),
			};
		},
	};
}
