/**
 * phase4-014 — hostile input battery for the HTML exporter.
 *
 * Threat model: every string in a `PageIR` is attacker-controlled
 * (LLM output, end-user text, imported documents). The exporter's
 * job is to emit HTML that is safe to serve as a static document.
 * This suite asserts the specific escapes and URL-scheme filters
 * documented in `docs/security/plugin-trust-model.md` §5.
 *
 * If a test here starts failing, stop. Either the escape surface
 * regressed (fix the exporter) or the trust-model doc needs
 * updating — never weaken the assertion to make the test pass.
 */
import type { PageIR, PageIRNode } from "@anvilkit/core/types";
import { describe, expect, it } from "vitest";

import { emitHtml, makeEmitContext } from "../emit-html.js";

function renderHero(props: Record<string, unknown>): string {
	const node: PageIRNode = { id: "hero", type: "Hero", props };
	const ir: PageIR = {
		version: "1",
		root: { id: "root", type: "__root__", props: {}, children: [node] },
		assets: [],
		metadata: {},
	};
	return emitHtml(ir, {}, makeEmitContext()).html;
}

function renderNavbar(props: Record<string, unknown>): string {
	const node: PageIRNode = { id: "nav", type: "Navbar", props };
	const ir: PageIR = {
		version: "1",
		root: { id: "root", type: "__root__", props: {}, children: [node] },
		assets: [],
		metadata: {},
	};
	return emitHtml(ir, {}, makeEmitContext()).html;
}

function renderBento(props: Record<string, unknown>): string {
	const node: PageIRNode = { id: "bg", type: "BentoGrid", props };
	const ir: PageIR = {
		version: "1",
		root: { id: "root", type: "__root__", props: {}, children: [node] },
		assets: [],
		metadata: {},
	};
	return emitHtml(ir, {}, makeEmitContext()).html;
}

function renderBlogList(props: Record<string, unknown>): string {
	const node: PageIRNode = { id: "bl", type: "BlogList", props };
	const ir: PageIR = {
		version: "1",
		root: { id: "root", type: "__root__", props: {}, children: [node] },
		assets: [],
		metadata: {},
	};
	return emitHtml(ir, {}, makeEmitContext()).html;
}

describe("HTML exporter — hostile text content (XSS via escapable chars)", () => {
	it("escapes <script> injected into a headline", () => {
		const html = renderHero({
			headline: "<script>alert('pwn')</script>",
		});
		expect(html).not.toContain("<script>");
		expect(html).toContain("&lt;script&gt;");
	});

	it("escapes mixed-case <ScRipT> tags", () => {
		const html = renderHero({
			headline: "<ScRipT>alert(1)</ScRipT>",
		});
		expect(html).not.toMatch(/<script/i);
	});

	it("escapes SVG inline with an onload handler in text content", () => {
		const html = renderHero({
			description: "<svg onload=alert(1)></svg>",
		});
		// The dangerous thing is a parseable <svg ...> element. Inside
		// element text, `onload=alert(1)` as literal characters is just
		// text — the browser does not parse attributes out of text nodes.
		expect(html).not.toMatch(/<svg[\s>]/i);
		expect(html).toContain("&lt;svg");
	});

	it("escapes <iframe> and <object> injected via a description prop", () => {
		const html = renderHero({
			description:
				'<iframe src="http://evil.example/"></iframe><object data="x"></object>',
		});
		expect(html).not.toContain("<iframe");
		expect(html).not.toContain("<object");
	});

	it("escapes & in text so existing entities do not chain", () => {
		const html = renderHero({ headline: "&lt;b&gt;bold&lt;/b&gt;" });
		// the literal string "&lt;" must appear escaped as "&amp;lt;",
		// otherwise a browser would decode it back to real angle brackets.
		expect(html).toContain("&amp;lt;b&amp;gt;");
	});

	it("escapes quotes and apostrophes inside headline text", () => {
		const html = renderHero({ headline: `" onmouseover='alert(1)` });
		// Quotes inside element content are still escaped.
		expect(html).not.toMatch(/<h1[^>]*>[^<]*"[^<]*<\/h1>/);
		expect(html).toContain("&quot;");
		expect(html).toContain("&#39;");
	});

	it("treats numeric and boolean props as strings (no crash, no raw passthrough)", () => {
		const html = renderHero({
			headline: 12345,
			description: true,
		});
		// Neither value should be quoted raw — getStringValue converts
		// numbers/booleans to strings before escaping.
		expect(html).toContain("12345");
		expect(html).toContain("true");
	});
});

describe("HTML exporter — hostile attribute values", () => {
	it("escapes a quote-breakout attempt in an attribute-style prop", () => {
		const html = renderBento({
			items: [
				{
					title: "Card",
					description: "body",
					ctaLabel: "Go",
					ctaHref: "https://example.com/",
					size: '" onload="alert(1)',
				},
			],
		});
		// The closing quote of the attribute must not be attackable:
		// escapeAttr maps " → &quot; and = → &#61;.
		expect(html).not.toMatch(/data-size="" onload/);
		expect(html).not.toContain(" onload=");
		expect(html).toContain("data-size=\"&quot; onload&#61;&quot;alert(1)\"");
	});

	it("escapes CSS-injection bait in a variant attribute", () => {
		const html = renderNavbar({
			actions: [
				{
					label: "Buy",
					href: "https://example.com/",
					variant: `primary"><style>body{display:none}</style><x `,
				},
			],
		});
		// The attacker's goal is to close `data-variant="..."` and open a
		// real <style>. Both must be blocked: the closing " becomes &quot;,
		// and the < of <style> becomes &lt;. There must be no parseable
		// <style> element in the output.
		expect(html).not.toMatch(/<style[\s>]/i);
		expect(html).not.toMatch(/<\/style>/i);
	});

	it("escapes equals-sign in attribute values (prevents x=y split)", () => {
		const html = renderBento({
			items: [
				{
					title: "X",
					size: "a=b",
				},
			],
		});
		expect(html).toContain('data-size="a&#61;b"');
	});
});

describe("HTML exporter — URL-scheme filter (normalizeUrl)", () => {
	it("rejects javascript: as an anchor href", () => {
		const html = renderHero({
			headline: "x",
			primaryCtaLabel: "Click",
			primaryCtaHref: "javascript:alert(1)",
		});
		// Without a safe href, the link renders as a disabled button, not an <a>.
		expect(html).not.toMatch(/href="javascript:/i);
		expect(html).toContain("disabled");
	});

	it("rejects vbscript: URLs", () => {
		const html = renderHero({
			headline: "x",
			primaryCtaLabel: "Click",
			primaryCtaHref: "vbscript:msgbox(1)",
		});
		expect(html).not.toMatch(/href="vbscript:/i);
	});

	it("rejects data: URLs even for image-looking payloads", () => {
		const html = renderHero({
			headline: "x",
			primaryCtaLabel: "Click",
			primaryCtaHref: "data:text/html,<script>alert(1)</script>",
		});
		expect(html).not.toMatch(/href="data:/i);
	});

	it("rejects mixed-case JaVaScRiPt:", () => {
		const html = renderHero({
			headline: "x",
			primaryCtaLabel: "Click",
			primaryCtaHref: "JaVaScRiPt:alert(1)",
		});
		expect(html).not.toMatch(/href="JaVaScRiPt:/i);
	});

	it("rejects file:// URLs as anchor hrefs", () => {
		const html = renderHero({
			headline: "x",
			primaryCtaLabel: "Click",
			primaryCtaHref: "file:///etc/passwd",
		});
		expect(html).not.toMatch(/href="file:/i);
	});

	it("rejects blob: URLs as anchor hrefs", () => {
		const html = renderHero({
			headline: "x",
			primaryCtaLabel: "Click",
			primaryCtaHref: "blob:https://evil.example/abcd",
		});
		expect(html).not.toMatch(/href="blob:/i);
	});

	it("rejects filesystem: URLs as anchor hrefs", () => {
		const html = renderHero({
			headline: "x",
			primaryCtaLabel: "Click",
			primaryCtaHref: "filesystem:https://evil.example/temporary/x",
		});
		expect(html).not.toMatch(/href="filesystem:/i);
	});

	it("rejects whitespace-camouflaged javascript: (tabs + newlines inside the scheme)", () => {
		const html = renderHero({
			headline: "x",
			primaryCtaLabel: "Click",
			primaryCtaHref: "jav\t\n\rascript:alert(1)",
		});
		expect(html).not.toMatch(/javascript/i);
		expect(html).not.toContain("alert(1)");
	});

	it("rejects leading-whitespace javascript:", () => {
		const html = renderHero({
			headline: "x",
			primaryCtaLabel: "Click",
			primaryCtaHref: "   javascript:alert(1)",
		});
		expect(html).not.toMatch(/javascript:/i);
	});

	it("passes http(s):// and relative URLs through unchanged", () => {
		const htmlHttps = renderHero({
			headline: "x",
			primaryCtaLabel: "Click",
			primaryCtaHref: "https://example.com/path",
		});
		expect(htmlHttps).toContain('href="https://example.com/path"');

		const htmlRelative = renderHero({
			headline: "x",
			primaryCtaLabel: "Click",
			primaryCtaHref: "/about",
		});
		expect(htmlRelative).toContain('href="/about"');
	});
});

describe("HTML exporter — hostile image URLs", () => {
	it("rejects javascript: in an image src (emits empty string, no <img>)", () => {
		const html = renderBlogList({
			posts: [
				{
					title: "Post",
					description: "body",
					imageSrc: "javascript:alert(1)",
					imageAlt: "cover",
				},
			],
		});
		expect(html).not.toMatch(/src="javascript:/i);
	});

	it("rejects inline <svg> bytes supplied as an image URL string", () => {
		// renderImage goes through normalizeUrl; a raw "<svg ..." string
		// is not a javascript:/vbscript:/data: scheme, so it survives
		// normalizeUrl — but the < and > get escaped by escapeAttr and
		// the browser will treat the resulting src as a broken URL,
		// not as markup.
		const html = renderBlogList({
			posts: [
				{
					title: "Post",
					description: "body",
					imageSrc: '<svg onload="alert(1)"></svg>',
					imageAlt: "cover",
				},
			],
		});
		expect(html).not.toContain('<svg onload="alert(1)">');
		// Closing the attribute context must be impossible:
		expect(html).not.toContain('" onload="');
	});

	it("rejects data:image/svg+xml with embedded script", () => {
		const html = renderBlogList({
			posts: [
				{
					title: "Post",
					description: "body",
					imageSrc:
						"data:image/svg+xml,<svg><script>alert(1)</script></svg>",
					imageAlt: "cover",
				},
			],
		});
		expect(html).not.toMatch(/src="data:image/i);
	});
});

describe("HTML exporter — CSS injection via class-influencing props", () => {
	it("does not allow theme/platform props to escape into a <style> or <script>", () => {
		const html = renderBento({
			theme: `dark"><style>body{background:red}</style><x "`,
			platform: `web"><script>alert(1)</script><y "`,
			items: [{ title: "ok" }],
		});
		// Both the opening < of a parseable style/script tag and the
		// closing " of the host attribute must stay escaped so the
		// browser never exits `data-theme=""` into markup context.
		expect(html).not.toMatch(/<style[\s>]/i);
		expect(html).not.toMatch(/<script[\s>]/i);
		expect(html).not.toMatch(/<\/style>/i);
		expect(html).not.toMatch(/<\/script>/i);
	});

	it("rejects class-name chars that would break out of an attribute", () => {
		const html = renderBento({
			items: [
				{
					title: "Card",
					size: `default"><img src=x onerror=alert(1)><`,
				},
			],
		});
		// The literal string "onerror=alert" only becomes dangerous if the
		// attacker can close the host attribute. escapeAttr maps " → &quot;
		// and = → &#61;, so neither an <img ...> element nor an
		// `onerror=handler` can be parsed into existence.
		expect(html).not.toMatch(/<img[\s>]/i);
		expect(html).not.toMatch(/onerror=/i);
	});
});

describe("HTML exporter — structural attacks on IR shape", () => {
	it("renders an unknown component type as an empty placeholder (no crash)", () => {
		const ir: PageIR = {
			version: "1",
			root: {
				id: "root",
				type: "__root__",
				props: {},
				children: [
					{ id: "x", type: "NotARealComponent", props: { a: 1 } },
				],
			},
			assets: [],
			metadata: {},
		};
		const result = emitHtml(ir, {}, makeEmitContext());
		expect(result.html).toBe('<div class="ak-unknown"></div>');
		expect(result.warnings.some((w) => w.code === "UNKNOWN_COMPONENT_EMITTER"))
			.toBe(true);
	});

	it("handles arbitrarily deep but empty children without stack issues", () => {
		const children: PageIRNode[] = [];
		for (let i = 0; i < 500; i += 1) {
			children.push({ id: `hero-${i}`, type: "Hero", props: { headline: `H${i}` } });
		}
		const ir: PageIR = {
			version: "1",
			root: { id: "root", type: "__root__", props: {}, children },
			assets: [],
			metadata: {},
		};
		const result = emitHtml(ir, {}, makeEmitContext());
		expect(result.html.length).toBeGreaterThan(0);
		// All 500 heroes emitted, none missing, none duplicated.
		const matches = result.html.match(/ak-hero__headline/g) ?? [];
		expect(matches).toHaveLength(500);
	});
});
