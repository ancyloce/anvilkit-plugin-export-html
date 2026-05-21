import { describe, expect, it } from "vitest";

import { emitCss } from "../emit/emit-css.js";

const BASE_RESET =
	":root{color-scheme:light;font-family:Inter,ui-sans-serif,system-ui,sans-serif;line-height:1.5;}" +
	"*{box-sizing:border-box;}" +
	"body{margin:0;background:#f5f1e8;color:#111827;}" +
	"a{color:inherit;text-decoration:none;}" +
	"img{display:block;max-width:100%;}";

describe("emitCss", () => {
	it("emits inline hero css only when hero is used", () => {
		const css = emitCss(new Set(["ak-hero"]), {});

		expect(css.startsWith("<style>")).toBe(true);
		expect(css.endsWith("</style>")).toBe(true);
		expect(css).toContain("ak-hero");
		expect(css).not.toContain("ak-section");
		expect(css).not.toContain("ak-navbar");
	});

	it("sorts emitted classname rules alphabetically", () => {
		const css = emitCss(new Set(["ak-navbar", "ak-hero"]), {});

		expect(css.indexOf(".ak-hero{")).toBeLessThan(css.indexOf(".ak-navbar{"));
	});

	it("throws when inlineStyles is false (sidecar CSS not yet supported)", () => {
		expect(() => emitCss(new Set(), { inlineStyles: false })).toThrow(
			/inlineStyles:false is not supported/,
		);
	});

	it("emits only the base reset when no component classes are used", () => {
		const css = emitCss(new Set(), {});

		expect(css).toBe(`<style>${BASE_RESET}</style>`);
		expect(css).not.toContain(".ak-hero{");
		expect(css).not.toContain(".ak-section{");
		expect(css).not.toContain(".ak-navbar{");
	});
});
