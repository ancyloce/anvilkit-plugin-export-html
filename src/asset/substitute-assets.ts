import { escapeAttr } from "../internal/escape-html.js";

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
 *
 * Asset ids are matched in their **escaped** form because `renderImage`
 * writes them through `escapeAttr`. Comparing on the escaped form means
 * an id containing `"`, `&`, `=`, etc. still matches the attribute
 * value the emitter actually produced.
 *
 * The fallback rewrite (uninlined assets) is scoped to the
 * `data-asset-src=` attribute we know `renderImage` emits, so user
 * text containing the literal string `data-asset-src=` is never
 * touched.
 */
export function substituteAssets(
	html: string,
	inlined: ReadonlyMap<string, string>,
): string {
	let result = html;

	for (const [assetId, dataUrl] of inlined) {
		const escapedAttrId = escapeAttr(assetId);
		const escapedRegexId = escapeRegex(escapedAttrId);

		// Order A: data-asset-src="…" [other attrs] data-asset-id="<id>"
		const orderA = new RegExp(
			'data-asset-src="[^"]*"([^>]*?)\\s+data-asset-id="' +
				escapedRegexId +
				'"',
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
				escapedAttrId +
				'"',
		);

		// Order B: data-asset-id="<id>" [other attrs] data-asset-src="…"
		const orderB = new RegExp(
			'data-asset-id="' +
				escapedRegexId +
				'"([^>]*?)\\s+data-asset-src="[^"]*"',
			"g",
		);
		result = result.replace(
			orderB,
			(_match, between: string) =>
				'data-asset-id="' +
				escapedAttrId +
				'"' +
				between +
				' src="' +
				escapeAttr(dataUrl) +
				'"',
		);
	}

	// Final fallback for assets that weren't inlined: rewrite the
	// emitter's marker attribute to a real `src=`. Match only the
	// emitter-produced form (`data-asset-src="…"`) so user text
	// containing the literal string `data-asset-src=` outside an
	// attribute position is never modified.
	return result.replace(
		/data-asset-src="([^"]*)"/g,
		(_match, value: string) => 'src="' + value + '"',
	);
}
