import { compilePlugins, StudioConfigSchema } from "@anvilkit/core";
import type {
	PageIR,
	StudioPlugin,
	StudioPluginContext,
} from "@anvilkit/core/types";
import { describe, expect, it, vi } from "vitest";

import { createHtmlExportPlugin } from "../create-html-export-plugin.js";
import { htmlFormat } from "../format-definition.js";

const studioConfig = StudioConfigSchema.parse({});

function makeCtx(): StudioPluginContext {
	return {
		getData: () => ({ root: { props: {} }, content: [], zones: {} }),
		getPuckApi: (() => {
			throw new Error("getPuckApi should not be invoked in compile tests");
		}) as unknown as StudioPluginContext["getPuckApi"],
		studioConfig,
		log: vi.fn(),
		emit: vi.fn(),
	};
}

function expectPluginMeta(plugin: StudioPlugin): void {
	expect(plugin.meta.id).toBe("anvilkit-plugin-export-html");
	expect(plugin.meta.name).toBe("HTML Export");
	expect(plugin.meta.version).toBe("0.1.0-alpha.0");
	expect(plugin.meta.coreVersion).toBe("^0.1.0-alpha");
	expect(plugin.meta.description).toEqual(expect.any(String));
	expect(plugin.meta.description).not.toHaveLength(0);
}

function makeHeroIr(): PageIR {
	return {
		version: "1",
		root: {
			id: "root",
			type: "__root__",
			props: {},
			children: [
				{
					id: "hero-1",
					type: "Hero",
					props: {},
				},
			],
		},
		assets: [],
		metadata: {},
	};
}

function countOccurrences(content: string, needle: string): number {
	return content.split(needle).length - 1;
}

describe("createHtmlExportPlugin", () => {
	it("returns the expected plugin meta shape", () => {
		const plugin = createHtmlExportPlugin();

		expectPluginMeta(plugin);
	});

	it("compiles through compilePlugins and registers the html format", async () => {
		const ctx = makeCtx();
		const runtime = await compilePlugins([createHtmlExportPlugin()], ctx);

		expect(runtime.pluginMeta).toHaveLength(1);
		expect(runtime.pluginMeta[0]?.id).toBe("anvilkit-plugin-export-html");
		expect(runtime.exportFormats.has("html")).toBe(true);
		expect(runtime.exportFormats.get("html")).toBe(htmlFormat);
	});

	it("returns the stub html export payload from htmlFormat.run()", async () => {
		const ir: PageIR = {
			version: "1",
			root: {
				id: "root",
				type: "__root__",
				props: {},
			},
			assets: [],
			metadata: {},
		};

		const result = await htmlFormat.run(ir, {});

		expect(result.content).toContain("<!doctype html>");
		expect(result.filename).toBe("page.html");
		expect(result.warnings).toEqual([]);
	});

	it("accepts options without changing the plugin meta shape", () => {
		const plugin = createHtmlExportPlugin({
			inlineStyles: true,
			title: "Test",
		});

		expectPluginMeta(plugin);
	});

	it("format.run returns a full HTML document", async () => {
		const result = await htmlFormat.run(makeHeroIr(), {
			inlineStyles: true,
			title: "My Page",
		});

		expect(result.content.startsWith("<!doctype html>")).toBe(true);
		expect(result.content).toContain('<meta charset="utf-8">');
		expect(result.content).toContain("<title>My Page</title>");
		expect(countOccurrences(result.content, "<style>")).toBe(1);
		expect(result.content).toContain('<section class="ak-hero">');
		expect(result.content).not.toContain('style="');
	});

	it("emits a loose single-document html structure", async () => {
		const result = await htmlFormat.run(makeHeroIr(), {
			inlineStyles: true,
			title: "My Page",
		});

		expect(countOccurrences(result.content, "<html ")).toBe(1);
		expect(countOccurrences(result.content, "</html>")).toBe(1);
		expect(countOccurrences(result.content, "<head>")).toBe(1);
		expect(countOccurrences(result.content, "</head>")).toBe(1);
		expect(countOccurrences(result.content, "<body>")).toBe(1);
		expect(countOccurrences(result.content, "</body>")).toBe(1);
	});

	it("registers the export html header action", async () => {
		const runtime = await compilePlugins([createHtmlExportPlugin()], makeCtx());

		expect(runtime.headerActions).toHaveLength(1);
		expect(runtime.headerActions[0]).toEqual(
			expect.objectContaining({
				id: "export-html",
				label: "Download HTML",
				icon: "download",
				group: "secondary",
			}),
		);
	});
});
