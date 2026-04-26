import { escapeAttr } from "./internal/escape-html.js";

function escapeRegex(input: string): string {
	return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Rewrite `data-asset-src=` markers emitted by `renderImage` to real
 * `src=` attributes — using inlined data URLs when available, falling
 * back to the original asset URL otherwise.
 *
 * The regex is intentionally permissive about whitespace and attribute
 * ordering between `data-asset-src` and `data-asset-id` so an emitter
 * change (e.g. inserting `loading="lazy"` between them, or swapping the
 * order) does not silently break inlining.
 */
export function substituteAssets(
	html: string,
	inlined: ReadonlyMap<string, string>,
): string {
	let result = html;

	for (const [assetId, dataUrl] of inlined) {
		const escapedId = escapeRegex(assetId);

		// Order A: data-asset-src="…" [other attrs] data-asset-id="<id>"
		const orderA = new RegExp(
			'data-asset-src="[^"]*"([^>]*?)\\s+data-asset-id="' + escapedId + '"',
			"g",
		);
		result = result.replace(
			orderA,
			(_match, between: string) =>
				'src="' +
				escapeAttr(dataUrl) +
				'"' +
				between +
				' data-asset-id="' +
				escapeAttr(assetId) +
				'"',
		);

		// Order B: data-asset-id="<id>" [other attrs] data-asset-src="…"
		const orderB = new RegExp(
			'data-asset-id="' + escapedId + '"([^>]*?)\\s+data-asset-src="[^"]*"',
			"g",
		);
		result = result.replace(
			orderB,
			(_match, between: string) =>
				'data-asset-id="' +
				escapeAttr(assetId) +
				'"' +
				between +
				' src="' +
				escapeAttr(dataUrl) +
				'"',
		);
	}

	return result.replaceAll("data-asset-src=", "src=");
}
