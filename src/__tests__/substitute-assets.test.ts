import { describe, expect, it } from "vitest";

import { substituteAssets } from "../substitute-assets.js";

describe("substituteAssets", () => {
	it("substitutes data-asset-src in the canonical order", () => {
		const html =
			'<img data-asset-src="https://cdn.example/a.png" data-asset-id="a" alt="A">';
		const result = substituteAssets(
			html,
			new Map([["a", "data:image/png;base64,QUJD"]]),
		);
		expect(result).toContain('src="data:image/png;base64,QUJD"');
		expect(result).toContain('data-asset-id="a"');
		expect(result).not.toContain("data-asset-src=");
	});

	it("tolerates extra attributes between data-asset-src and data-asset-id", () => {
		const html =
			'<img data-asset-src="https://cdn.example/a.png" loading="lazy" data-asset-id="a" alt="A">';
		const result = substituteAssets(
			html,
			new Map([["a", "data:image/png;base64,QUJD"]]),
		);
		expect(result).toContain('src="data:image/png;base64,QUJD"');
		expect(result).toContain('loading="lazy"');
		expect(result).toContain('data-asset-id="a"');
		expect(result).not.toContain("data-asset-src=");
	});

	it("tolerates reversed order (data-asset-id before data-asset-src)", () => {
		const html =
			'<img data-asset-id="a" loading="lazy" data-asset-src="https://cdn.example/a.png" alt="A">';
		const result = substituteAssets(
			html,
			new Map([["a", "data:image/png;base64,QUJD"]]),
		);
		expect(result).toContain('src="data:image/png;base64,QUJD"');
		expect(result).toContain('data-asset-id="a"');
		expect(result).not.toContain("data-asset-src=");
	});

	it("falls back to the original URL when an asset is not inlined", () => {
		const html =
			'<img data-asset-src="https://cdn.example/a.png" data-asset-id="a" alt="A">';
		const result = substituteAssets(html, new Map());
		expect(result).toContain('src="https://cdn.example/a.png"');
		expect(result).toContain('data-asset-id="a"');
		expect(result).not.toContain("data-asset-src=");
	});
});
