import type { PageIR, StudioPlugin, StudioPluginContext } from "@anvilkit/core";
import { compilePlugins, StudioConfigSchema } from "@anvilkit/core";
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

		expect(result.content).toBe("<!-- stub -->");
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
});
