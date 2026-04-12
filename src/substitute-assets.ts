import { escapeAttr } from "./internal/escape-html.js";

function escapeRegex(input: string): string {
	return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function substituteAssets(
	html: string,
	inlined: ReadonlyMap<string, string>,
): string {
	let result = html;

	for (const [assetId, dataUrl] of inlined) {
		const markerPattern = new RegExp(
			'data-asset-src="[^"]*" data-asset-id="' +
				escapeRegex(assetId) +
				'"',
			"g",
		);

		result = result.replace(
			markerPattern,
			() =>
				'src="' +
				escapeAttr(dataUrl) +
				'" data-asset-id="' +
				escapeAttr(assetId) +
				'"',
		);
	}

	return result.replaceAll("data-asset-src=", "src=");
}
