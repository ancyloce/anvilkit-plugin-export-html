import type {
	ExportFormatDefinition,
	StudioHeaderAction,
	StudioPluginContext,
} from "@anvilkit/core/types";

import type { HtmlExportOptions, IRBuilder } from "./types.js";

const DEFAULT_HEADER_ACTION: Omit<StudioHeaderAction, "onClick"> = {
	id: "export-html",
	label: "Download HTML",
	icon: "download",
	group: "secondary",
	order: 100,
};

/**
 * Build a header action whose `onClick` actually runs the bound HTML
 * export format and broadcasts the result.
 *
 * - When `options.buildIR` is provided, the action constructs a
 *   `PageIR` via that builder, runs the export format with any
 *   `assetResolvers` configured on the plugin, and emits
 *   `anvilkit:export:ready` with the resulting payload (host listens
 *   to trigger a download).
 * - Otherwise, the action emits `anvilkit:export:request` so the host
 *   can perform the export end-to-end with its own Puck `Config` and
 *   the runtime's collected asset resolvers. Note: the base
 *   `<Studio>` `emit` implementation is a no-op until the plugin
 *   event bus ships, so consumers without `buildIR` must wire their
 *   own listener (e.g. via a host-supplied `emit` adapter) to receive
 *   `anvilkit:export:request`.
 */
export function createExportHtmlHeaderAction(
	format: ExportFormatDefinition<HtmlExportOptions>,
	options: HtmlExportOptions,
): StudioHeaderAction {
	const buildIR: IRBuilder | undefined = options.buildIR;

	return {
		...DEFAULT_HEADER_ACTION,
		onClick: async (ctx: StudioPluginContext) => {
			if (!buildIR) {
				ctx.log(
					"info",
					"HTML export requested. Pass a buildIR option to createHtmlExportPlugin " +
						"to run the export end-to-end, or listen for the anvilkit:export:request " +
						"event to handle it from the host.",
				);
				ctx.emit("anvilkit:export:request", {
					formatId: format.id,
					options,
				});
				return;
			}

			try {
				const ir = await buildIR(ctx);
				const result = await format.run(ir, options, {
					assetResolvers: options.assetResolvers,
				});
				ctx.emit("anvilkit:export:ready", {
					formatId: format.id,
					content: result.content,
					filename: result.filename,
					mimeType: format.mimeType,
					warnings: result.warnings,
				});
			} catch (error) {
				ctx.log("error", "HTML export failed.", {
					message: error instanceof Error ? error.message : String(error),
				});
				throw error;
			}
		},
	};
}

/**
 * Default header action used when the consumer imports
 * `exportHtmlHeaderAction` directly without going through
 * `createHtmlExportPlugin`. This shape is preserved for backward
 * compatibility; in production it is superseded by the bound action
 * returned from `createExportHtmlHeaderAction(format, options)`.
 */
export const exportHtmlHeaderAction: StudioHeaderAction = {
	...DEFAULT_HEADER_ACTION,
	onClick: async (ctx) => {
		ctx.log(
			"info",
			"HTML export requested. Use createHtmlExportPlugin() to obtain a header " +
				"action wired to a concrete format and options.",
		);
		ctx.emit("anvilkit:export:request", { formatId: "html", options: {} });
	},
};
