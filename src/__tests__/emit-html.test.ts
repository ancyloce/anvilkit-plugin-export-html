import type { PageIR, PageIRNode } from "@anvilkit/core/types";
import { describe, expect, it } from "vitest";

import { emitHtml, makeEmitContext } from "../emit-html.js";

function makePageIr(node: PageIRNode): PageIR {
	return {
		version: "1",
		root: {
			id: "root",
			type: "__root__",
			props: {},
			children: [node],
		},
		assets: [],
		metadata: {},
	};
}

function renderNode(
	type: string,
	props: Readonly<Record<string, unknown>> = {},
): ReturnType<typeof emitHtml> {
	return emitHtml(
		makePageIr({
			id: "node-1",
			type,
			props,
		}),
		{},
		makeEmitContext(),
	);
}

function expectRendered(type: string, classname: string): void {
	const result = renderNode(type);

	expect(result.html).not.toBe("");
	expect(result.html).toContain(`class="${classname}"`);
	expect(result.usedClassnames.has(classname)).toBe(true);
}

describe("emitHtml", () => {
	it("emits Hero markup", () => {
		expectRendered("Hero", "ak-hero");
	});

	it("emits Navbar markup", () => {
		expectRendered("Navbar", "ak-navbar");
	});

	it("emits PricingMinimal markup", () => {
		expectRendered("PricingMinimal", "ak-pricing-minimal");
	});

	it("emits BentoGrid markup", () => {
		expectRendered("BentoGrid", "ak-bento-grid");
	});

	it("emits Section markup", () => {
		expectRendered("Section", "ak-section");
	});

	it("emits Statistics markup", () => {
		expectRendered("Statistics", "ak-statistics");
	});

	it("emits BlogList markup", () => {
		expectRendered("BlogList", "ak-blog-list");
	});

	it("emits Helps markup", () => {
		expectRendered("Helps", "ak-helps");
	});

	it("emits LogoClouds markup", () => {
		expectRendered("LogoClouds", "ak-logo-clouds");
	});

	it("escapes script tags in text content", () => {
		const payload = "<script>alert(1)</script>";
		const result = renderNode("Hero", {
			title: payload,
			headline: payload,
		});

		expect(result.html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
		expect(result.html).not.toContain("<script");
		expect(result.html).not.toContain("</script>");
	});

	it("falls back to the unknown component emitter", () => {
		const result = emitHtml(
			makePageIr({
				id: "x1",
				type: "DoesNotExist",
				props: {},
			}),
			{},
			makeEmitContext(),
		);

		expect(result.html).toContain('<div class="ak-unknown"></div>');
		expect(result.warnings).toHaveLength(1);
		expect(result.warnings[0]).toMatchObject({
			code: "UNKNOWN_COMPONENT_EMITTER",
			level: "warn",
			nodeId: "x1",
		});
		expect(result.usedClassnames.has("ak-unknown")).toBe(true);
	});

	it("rejects javascript urls in href props", () => {
		const result = renderNode("Hero", {
			primaryCtaLabel: "Click me",
			primaryCtaHref: "javascript:alert(1)",
		});

		expect(result.html).not.toContain("javascript:");
	});
});
