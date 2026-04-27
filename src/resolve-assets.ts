import type {
	ExportWarning,
	IRAssetResolver,
	PageIR,
	PageIRAsset,
	PageIRNode,
} from "@anvilkit/core/types";

import { normalizeUrl } from "./emit-html.js";

const ASSET_REFERENCE_PREFIX = "asset://";
const ASSET_PROP_KEYS = new Set([
	"src",
	"imageUrl",
	"imageSrc",
	"url",
	"videoUrl",
	"videoSrc",
	"fontUrl",
	"scriptUrl",
	"styleUrl",
	"backgroundSrc",
	"backgroundImage",
	"poster",
	"thumbnailSrc",
]);

interface AssetReferenceInfo {
	readonly kind?: PageIRAsset["kind"];
	readonly nodeId?: string;
	readonly allowSafeDataImage?: boolean;
}

const SAFE_DATA_IMAGE_KEYS = new Set([
	"src",
	"imageUrl",
	"imageSrc",
	"backgroundSrc",
	"backgroundImage",
	"poster",
	"thumbnailSrc",
]);

export async function resolveHtmlAssetUrls(
	ir: PageIR,
	assetResolvers: readonly IRAssetResolver[] = [],
): Promise<{ ir: PageIR; warnings: ExportWarning[] }> {
	const warnings: ExportWarning[] = [];
	const blockedUrls = new Set<string>();
	const rewrittenUrls = new Map<string, string>();
	const references = collectAssetReferences(ir);

	for (const [url, info] of references) {
		const assetId = parseAssetId(url);
		if (assetId === null) {
			continue;
		}

		try {
			const resolution = await resolveWithResolvers(url, assetResolvers);
			if (resolution === null) {
				blockedUrls.add(url);
				warnings.push(makeUnresolvedWarning(assetId, info.nodeId));
				continue;
			}

			const normalizedUrl = normalizeUrl(resolution.url, {
				allowSafeDataImage:
					info.kind === "image" || info.allowSafeDataImage === true,
			});
			if (!normalizedUrl) {
				blockedUrls.add(url);
				warnings.push({
					level: "warn",
					code: "ASSET_UNRESOLVED",
					message:
						`Asset "${assetId}" resolved to a disallowed URL during HTML export and was omitted.`,
					...(info.nodeId ? { nodeId: info.nodeId } : {}),
				});
				continue;
			}

			rewrittenUrls.set(url, normalizedUrl);
		} catch (error) {
			if (!isAssetResolutionError(error)) {
				throw error;
			}

			blockedUrls.add(url);
			warnings.push({
				level: "warn",
				code: "ASSET_UNRESOLVED",
				message: error.message,
				...(info.nodeId ? { nodeId: info.nodeId } : {}),
			});
		}
	}

	if (blockedUrls.size === 0 && rewrittenUrls.size === 0) {
		return { ir, warnings };
	}

	const nextIr: PageIR = {
		version: ir.version,
		root: cloneNode(ir.root, rewrittenUrls, blockedUrls),
		assets: ir.assets
			.map((asset) => cloneAsset(asset, rewrittenUrls, blockedUrls))
			.filter((asset): asset is PageIRAsset => asset !== null),
		metadata: { ...ir.metadata },
	};

	return {
		ir: deepFreeze(nextIr),
		warnings,
	};
}

async function resolveWithResolvers(
	url: string,
	assetResolvers: readonly IRAssetResolver[],
) {
	for (const resolver of assetResolvers) {
		const resolution = await resolver(url);
		if (resolution !== null) {
			return resolution;
		}
	}

	return null;
}

function collectAssetReferences(ir: PageIR): Map<string, AssetReferenceInfo> {
	const references = new Map<string, AssetReferenceInfo>();

	for (const asset of ir.assets) {
		references.set(asset.url, {
			kind: asset.kind,
			allowSafeDataImage: asset.kind === "image",
		});
	}

	walkNode(ir.root, references);
	return references;
}

function walkNode(
	node: PageIRNode,
	references: Map<string, AssetReferenceInfo>,
): void {
	collectPropUrls(node.props, references, node.id);

	if (node.assets) {
		for (const asset of node.assets) {
			const current = references.get(asset.url);
			references.set(asset.url, {
				kind: current?.kind ?? asset.kind,
				nodeId: current?.nodeId ?? node.id,
				allowSafeDataImage:
					current?.allowSafeDataImage ?? (asset.kind === "image"),
			});
		}
	}

	if (node.children) {
		for (const child of node.children) {
			walkNode(child, references);
		}
	}
}

function collectPropUrls(
	value: unknown,
	references: Map<string, AssetReferenceInfo>,
	nodeId: string,
	key?: string,
): void {
	if (Array.isArray(value)) {
		for (const entry of value) {
			collectPropUrls(entry, references, nodeId);
		}
		return;
	}

	if (typeof value === "string") {
		if (key !== undefined && ASSET_PROP_KEYS.has(key)) {
			const current = references.get(value);
			references.set(value, {
				kind: current?.kind,
				nodeId: current?.nodeId ?? nodeId,
				allowSafeDataImage:
					current?.allowSafeDataImage ?? SAFE_DATA_IMAGE_KEYS.has(key),
			});
		}
		return;
	}

	if (value === null || typeof value !== "object") {
		return;
	}

	for (const [entryKey, entryValue] of Object.entries(
		value as Record<string, unknown>,
	)) {
		collectPropUrls(entryValue, references, nodeId, entryKey);
	}
}

function cloneNode(
	node: PageIRNode,
	rewrittenUrls: ReadonlyMap<string, string>,
	blockedUrls: ReadonlySet<string>,
): PageIRNode {
	return {
		id: node.id,
		type: node.type,
		props: cloneValue(
			node.props,
			rewrittenUrls,
			blockedUrls,
		) as Readonly<Record<string, unknown>>,
		// Preserve `slot` and `slotKind` so a rewritten/blocked clone
		// keeps the same parent-slot relationship as the input. The HTML
		// emitters do not currently use these fields, but the helper
		// returns a `PageIR` and must not silently lose shape.
		...(node.slot !== undefined ? { slot: node.slot } : {}),
		...(node.slotKind !== undefined ? { slotKind: node.slotKind } : {}),
		...(node.children
			? {
					children: node.children.map((child) =>
						cloneNode(child, rewrittenUrls, blockedUrls),
					),
				}
			: {}),
		...(node.assets
			? {
					assets: node.assets
						.map((asset) => cloneAsset(asset, rewrittenUrls, blockedUrls))
						.filter((asset): asset is PageIRAsset => asset !== null),
				}
			: {}),
	};
}

function cloneAsset(
	asset: PageIRAsset,
	rewrittenUrls: ReadonlyMap<string, string>,
	blockedUrls: ReadonlySet<string>,
): PageIRAsset | null {
	if (blockedUrls.has(asset.url)) {
		return null;
	}

	return {
		id: asset.id,
		kind: asset.kind,
		url: rewrittenUrls.get(asset.url) ?? asset.url,
		// Clone `meta` instead of reusing the caller's reference. The
		// resolver `deepFreeze`s the cloned IR; sharing the same `meta`
		// object would freeze the caller's input metadata as a side
		// effect of running the export.
		...(asset.meta ? { meta: { ...asset.meta } } : {}),
	};
}

function cloneValue(
	value: unknown,
	rewrittenUrls: ReadonlyMap<string, string>,
	blockedUrls: ReadonlySet<string>,
	key?: string,
): unknown {
	if (Array.isArray(value)) {
		return value.map((entry) => cloneValue(entry, rewrittenUrls, blockedUrls));
	}

	if (typeof value === "string") {
		if (key === undefined || !ASSET_PROP_KEYS.has(key)) {
			return value;
		}

		if (blockedUrls.has(value)) {
			return "";
		}

		return rewrittenUrls.get(value) ?? value;
	}

	if (value === null || typeof value !== "object") {
		return value;
	}

	const nextValue: Record<string, unknown> = {};
	for (const [entryKey, entryValue] of Object.entries(
		value as Record<string, unknown>,
	)) {
		nextValue[entryKey] = cloneValue(
			entryValue,
			rewrittenUrls,
			blockedUrls,
			entryKey,
		);
	}

	return nextValue;
}

function parseAssetId(url: string): string | null {
	if (!url.startsWith(ASSET_REFERENCE_PREFIX)) {
		return null;
	}

	const assetId = url.slice(ASSET_REFERENCE_PREFIX.length).trim();
	return assetId === "" ? null : assetId;
}

function makeUnresolvedWarning(assetId: string, nodeId?: string): ExportWarning {
	return {
		level: "warn",
		code: "ASSET_UNRESOLVED",
		message: `Asset "${assetId}" could not be resolved during HTML export and was omitted.`,
		...(nodeId ? { nodeId } : {}),
	};
}

function isAssetResolutionError(
	error: unknown,
): error is Error & { assetId: string } {
	return (
		error instanceof Error &&
		error.name === "AssetResolutionError" &&
		typeof (error as { assetId?: unknown }).assetId === "string"
	);
}

function deepFreeze<T>(value: T): T {
	if (value === null || typeof value !== "object" || Object.isFrozen(value)) {
		return value;
	}

	Object.freeze(value);
	for (const entry of Object.values(value as Record<string, unknown>)) {
		deepFreeze(entry);
	}

	return value;
}
