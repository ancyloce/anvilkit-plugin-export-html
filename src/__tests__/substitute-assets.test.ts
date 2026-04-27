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

	it("matches asset ids that contain HTML-escaped characters", () => {
		// `renderImage` writes data-asset-id values through `escapeAttr`,
		// so an id like `a&b="c"` lands in the markup as
		// `a&amp;b&#61;&quot;c&quot;`. `substituteAssets` must compare on
		// the escaped form rather than the raw id.
		const escapedId = "a&amp;b&#61;&quot;c&quot;";
		const html =
			'<img data-asset-src="https://cdn.example/x.png" data-asset-id="' +
			escapedId +
			'" alt="X">';
		const result = substituteAssets(
			html,
			new Map([['a&b="c"', "data:image/png;base64,QUJD"]]),
		);
		expect(result).toContain('src="data:image/png;base64,QUJD"');
		expect(result).toContain('data-asset-id="' + escapedId + '"');
	});

	it("does not rewrite escaped user text that mentions data-asset-src", () => {
		// Text rendered through `escapeHtml` would have its `"`
		// characters turned into `&quot;`, so even user prose that
		// mentions the marker attribute does not match the canonical
		// `data-asset-src="…"` shape and is left alone.
		const html =
			"<p>Reference: data-asset-src=&quot;not-an-image&quot;</p>" +
			'<img data-asset-src="https://cdn.example/a.png" data-asset-id="a" alt="A">';
		const result = substituteAssets(html, new Map());

		expect(result).toContain(
			"<p>Reference: data-asset-src=&quot;not-an-image&quot;</p>",
		);
		expect(result).toContain('src="https://cdn.example/a.png"');
	});
});
