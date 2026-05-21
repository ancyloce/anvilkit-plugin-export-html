import type { PageIR } from "@anvilkit/core/types";
import { describe, expect, it } from "vitest";

import { htmlFormat } from "../format/format-definition.js";

function makeIr(metadata: PageIR["metadata"]): PageIR {
	return {
		version: "1",
		root: {
			id: "root",
			type: "__root__",
			props: {},
			children: [{ id: "hero-1", type: "Hero", props: { headline: "Hi" } }],
		},
		assets: [],
		metadata,
	};
}

describe("htmlFormat metadata wiring", () => {
	it("falls back to ir.metadata.title when options.title is omitted", async () => {
		const result = await htmlFormat.run(
			makeIr({ title: "Metadata Title" }),
			{},
		);
		expect(result.content).toContain("<title>Metadata Title</title>");
	});

	it("prefers options.title over ir.metadata.title when both are set", async () => {
		const result = await htmlFormat.run(makeIr({ title: "Metadata Title" }), {
			title: "Override",
		});
		expect(result.content).toContain("<title>Override</title>");
	});

	it("emits an escaped meta description when ir.metadata.description is set", async () => {
		const description = 'Build & ship with "Anvilkit"';
		const result = await htmlFormat.run(makeIr({ description }), {});
		expect(result.content).toContain(
			'<meta name="description" content="Build &amp; ship with &quot;Anvilkit&quot;">',
		);
	});

	it("omits the description meta tag when none is provided", async () => {
		const result = await htmlFormat.run(makeIr({}), {});
		expect(result.content).not.toContain('name="description"');
	});
});
