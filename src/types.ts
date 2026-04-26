import type { PageIR, StudioPluginContext } from "@anvilkit/core/types";

export type FetchAssetFn = (
	url: string,
) => Promise<{ bytes: Uint8Array; contentType: string }>;

/**
 * Build a {@link PageIR} from the live Studio context. Supplied by the
 * host so the HTML export header action can run end-to-end without the
 * plugin needing access to the host's Puck `Config`.
 *
 * Hosts typically implement this with `puckDataToIR(ctx.getData(),
 * puckConfig)` from `@anvilkit/ir`.
 */
export type IRBuilder = (
	ctx: StudioPluginContext,
) => PageIR | Promise<PageIR>;

export interface HtmlExportOptions extends Record<string, unknown> {
	readonly inlineStyles?: boolean;
	readonly inlineAssetThresholdBytes?: number;
	readonly title?: string;
	readonly fetchAsset?: FetchAssetFn;
	/**
	 * BCP 47 language tag emitted on the document `<html lang="…">`
	 * element. Defaults to `"en"` when omitted.
	 */
	readonly lang?: string;
	/**
	 * Optional builder used by the export header action to obtain a
	 * {@link PageIR} from the live Studio context. When provided, the
	 * action runs the format and broadcasts an `anvilkit:export:ready`
	 * event with the resulting payload. When omitted, the action falls
	 * back to broadcasting an `anvilkit:export:request` event so the
	 * host can perform the export itself.
	 */
	readonly buildIR?: IRBuilder;
}
