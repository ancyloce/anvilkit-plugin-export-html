import type { ExportWarning, PageIRAsset } from "@anvilkit/core/types";

import { encodeBase64 } from "../internal/base64.js";
import type { FetchAssetFn } from "../types/types.js";

interface InlineEntry {
	readonly assetId: string;
	readonly dataUrl?: string;
	readonly warning?: ExportWarning;
}

const ALLOWED_FETCH_SCHEMES = new Set(["http:", "https:"]);

function getAssetUrlScheme(url: string): string | null {
	try {
		return new URL(url).protocol;
	} catch {
		return null;
	}
}

async function inlineAsset(
	asset: PageIRAsset,
	opts: {
		thresholdBytes: number;
		fetchAsset: FetchAssetFn;
		usingDefaultFetcher: boolean;
	},
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

	if (opts.usingDefaultFetcher) {
		const scheme = getAssetUrlScheme(asset.url);
		if (scheme === null || !ALLOWED_FETCH_SCHEMES.has(scheme)) {
			return {
				assetId: asset.id,
				warning: {
					level: "warn",
					code: "ASSET_FETCH_BLOCKED",
					message:
						"Skipped inlining asset " +
						asset.id +
						" because its URL scheme is not allowed by the default fetcher. " +
						"Pass a custom fetchAsset to opt into other schemes.",
				},
			};
		}
	}

	try {
		const fetched = await opts.fetchAsset(asset.url, {
			maxBytes: opts.thresholdBytes,
		});

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
	opts: {
		thresholdBytes: number;
		fetchAsset?: FetchAssetFn;
		emittedAssetIds?: ReadonlySet<string>;
	},
): Promise<{ inlined: Map<string, string>; warnings: ExportWarning[] }> {
	// Restrict the set of assets to those that were actually emitted as
	// `data-asset-id` markers. Without this filter, a malicious or stale
	// `PageIR.assets` entry would be fetched even when no emitter
	// references it. When `emittedAssetIds` is omitted (legacy callers),
	// fall back to the full asset list to preserve behavior.
	const candidates = opts.emittedAssetIds
		? assets.filter((asset) => opts.emittedAssetIds!.has(asset.id))
		: assets;

	if (!opts.fetchAsset) {
		return { inlined: new Map(), warnings: [] };
	}

	const fetchAsset = opts.fetchAsset;
	const usingDefaultFetcher = fetchAsset === defaultFetchAsset;
	const entries = await Promise.all(
		candidates.map((asset) =>
			inlineAsset(asset, {
				thresholdBytes: opts.thresholdBytes,
				fetchAsset,
				usingDefaultFetcher,
			}),
		),
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

export const defaultFetchAsset: FetchAssetFn = async (url, opts) => {
	const scheme = getAssetUrlScheme(url);
	if (scheme === null || !ALLOWED_FETCH_SCHEMES.has(scheme)) {
		throw new Error(
			"defaultFetchAsset refused to fetch " +
				url +
				": only http(s) URLs are allowed.",
		);
	}

	const response = await fetch(url);

	if (!response.ok) {
		throw new Error("fetch " + url + ": " + String(response.status));
	}

	// Reject early when the server advertises a payload that already
	// exceeds our cap; otherwise a hostile/large image is fully
	// downloaded into memory before the threshold check fires.
	const maxBytes = opts?.maxBytes;
	if (maxBytes !== undefined) {
		const contentLength = response.headers.get("content-length");
		if (contentLength !== null) {
			const advertised = Number.parseInt(contentLength, 10);
			if (Number.isFinite(advertised) && advertised > maxBytes) {
				throw new Error(
					"fetch " +
						url +
						": Content-Length " +
						String(advertised) +
						" exceeds the inline byte threshold (" +
						String(maxBytes) +
						").",
				);
			}
		}
	}

	const contentType =
		response.headers.get("content-type") ?? "application/octet-stream";

	// Stream the body and bail out as soon as the running byte count
	// would exceed the cap. If the body is not a streaming Response
	// (older runtimes / mocks), fall back to a single arrayBuffer read
	// so behavior is preserved for tests.
	if (maxBytes !== undefined && response.body !== null) {
		const reader = response.body.getReader();
		const chunks: Uint8Array[] = [];
		let total = 0;
		try {
			for (;;) {
				const { done, value } = await reader.read();
				if (done) {
					break;
				}
				if (value) {
					total += value.byteLength;
					if (total > maxBytes) {
						throw new Error(
							"fetch " +
								url +
								": streamed body exceeds the inline byte threshold (" +
								String(maxBytes) +
								").",
						);
					}
					chunks.push(value);
				}
			}
		} finally {
			reader.releaseLock();
		}
		const bytes = new Uint8Array(total);
		let offset = 0;
		for (const chunk of chunks) {
			bytes.set(chunk, offset);
			offset += chunk.byteLength;
		}
		return { bytes, contentType };
	}

	const bytes = new Uint8Array(await response.arrayBuffer());

	return { bytes, contentType };
};
