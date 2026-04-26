import type { ExportWarning, PageIRAsset } from "@anvilkit/core/types";

import { encodeBase64 } from "./internal/base64.js";
import type { FetchAssetFn } from "./types.js";

interface InlineEntry {
	readonly assetId: string;
	readonly dataUrl?: string;
	readonly warning?: ExportWarning;
}

async function inlineAsset(
	asset: PageIRAsset,
	opts: { thresholdBytes: number; fetchAsset: FetchAssetFn },
): Promise<InlineEntry> {
	if (asset.kind !== "image") {
		return {
			assetId: asset.id,
			warning: {
				level: "warn",
				code: "UNINLINEABLE_ASSET_KIND",
				message:
					"Skipped inlining asset " +
					asset.id +
					" because the HTML exporter only inlines image assets " +
					'(received kind="' +
					asset.kind +
					'"). The original URL will be preserved in the output.',
			},
		};
	}

	try {
		const fetched = await opts.fetchAsset(asset.url);

		if (fetched.bytes.length > opts.thresholdBytes) {
			return {
				assetId: asset.id,
				warning: {
					level: "warn",
					code: "MISSING_INLINE",
					message:
						"Skipped inlining asset " +
						asset.id +
						" because it exceeds the " +
						String(opts.thresholdBytes) +
						" byte threshold.",
				},
			};
		}

		return {
			assetId: asset.id,
			dataUrl:
				"data:" +
				fetched.contentType +
				";base64," +
				encodeBase64(fetched.bytes),
		};
	} catch (error) {
		return {
			assetId: asset.id,
			warning: {
				level: "warn",
				code: "ASSET_FETCH_FAILED",
				message:
					"Failed to fetch asset " +
					asset.id +
					" from " +
					asset.url +
					": " +
					(error instanceof Error ? error.message : String(error)),
			},
		};
	}
}

export async function inlineAssets(
	assets: readonly PageIRAsset[],
	opts: { thresholdBytes: number; fetchAsset: FetchAssetFn },
): Promise<{ inlined: Map<string, string>; warnings: ExportWarning[] }> {
	const entries = await Promise.all(
		assets.map((asset) => inlineAsset(asset, opts)),
	);

	const inlined = new Map<string, string>();
	const warnings: ExportWarning[] = [];

	for (const entry of entries) {
		if (entry.dataUrl !== undefined) {
			inlined.set(entry.assetId, entry.dataUrl);
		}
		if (entry.warning !== undefined) {
			warnings.push(entry.warning);
		}
	}

	return { inlined, warnings };
}

export const defaultFetchAsset: FetchAssetFn = async (url) => {
	const response = await fetch(url);

	if (!response.ok) {
		throw new Error("fetch " + url + ": " + String(response.status));
	}

	const contentType =
		response.headers.get("content-type") ?? "application/octet-stream";
	const bytes = new Uint8Array(await response.arrayBuffer());

	return { bytes, contentType };
};
