import type { ExportWarning, PageIRAsset } from "@anvilkit/core/types";

import { encodeBase64 } from "./internal/base64.js";
import type { FetchAssetFn } from "./types.js";

export async function inlineAssets(
	assets: readonly PageIRAsset[],
	opts: { thresholdBytes: number; fetchAsset: FetchAssetFn },
): Promise<{ inlined: Map<string, string>; warnings: ExportWarning[] }> {
	const inlined = new Map<string, string>();
	const warnings: ExportWarning[] = [];

	for (const asset of assets) {
		if (asset.kind !== "image") {
			continue;
		}

		try {
			const fetched = await opts.fetchAsset(asset.url);

			if (fetched.bytes.length > opts.thresholdBytes) {
				warnings.push({
					level: "warn",
					code: "MISSING_INLINE",
					message:
						"Skipped inlining asset " +
						asset.id +
						" because it exceeds the " +
						String(opts.thresholdBytes) +
						" byte threshold.",
				});
				continue;
			}

			inlined.set(
				asset.id,
				"data:" +
					fetched.contentType +
					";base64," +
					encodeBase64(fetched.bytes),
			);
		} catch (error) {
			warnings.push({
				level: "warn",
				code: "ASSET_FETCH_FAILED",
				message:
					"Failed to fetch asset " +
					asset.id +
					" from " +
					asset.url +
					": " +
					(error instanceof Error ? error.message : String(error)),
			});
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
