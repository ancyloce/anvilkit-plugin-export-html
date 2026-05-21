import type {
	IRAssetResolver,
	PageIR,
	StudioPluginContext,
} from "@anvilkit/core/types";

/**
 * Optional hints the format passes to a custom fetcher.
 *
 * The default fetcher uses these to enforce byte caps before fully
 * downloading a payload (Content-Length pre-check + streaming body).
 * Custom fetchers are free to ignore the bag entirely; the field
 * exists so hosts that wrap `defaultFetchAsset` can honor the same
 * limits the format would have applied.
 */
export interface FetchAssetOptions {
	readonly maxBytes?: number;
}

export type FetchAssetFn = (
	url: string,
	opts?: FetchAssetOptions,
) => Promise<{ bytes: Uint8Array; contentType: string }>;

/**
 * Build a {@link PageIR} from the live Studio context. Supplied by the
 * host so the HTML export header action can run end-to-end without the
 * plugin needing access to the host's Puck `Config`.
 *
 * Hosts typically implement this with `puckDataToIR(ctx.getData(),
 * puckConfig)` from `@anvilkit/ir`.
 */
export type IRBuilder = (ctx: StudioPluginContext) => PageIR | Promise<PageIR>;

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
	/**
	 * Optional asset resolvers consulted before rendering. Used by the
	 * header action's `buildIR` path so `asset://` references resolve
	 * the same way they would when the host calls `format.run()`
	 * directly with `runtime.assetResolvers`. When the host's export
	 * pipeline already supplies resolvers via the third `runCtx`
	 * argument to `format.run()`, those are merged with this list.
	 */
	readonly assetResolvers?: readonly IRAssetResolver[];
	/**
	 * Whether `createHtmlExportPlugin()` should contribute the Studio
	 * header action. Defaults to `true` when `buildIR` is supplied and
	 * `false` otherwise, so the stock Studio toolbar only shows a
	 * "Download HTML" action when the plugin can run the export
	 * end-to-end. Set this to `true` without `buildIR` only when the host
	 * has wired an `anvilkit:export:request` listener.
	 */
	readonly headerAction?: boolean;
}
