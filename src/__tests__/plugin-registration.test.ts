import { compilePlugins, StudioConfigSchema } from "@anvilkit/core";
import type { StudioPluginContext } from "@anvilkit/core/types";
import { describe, expect, it, vi } from "vitest";
import { createHtmlExportPlugin } from "../index.js";
import { heroFixture } from "./__fixtures__/hero.fixture.js";

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

describe("createHtmlExportPlugin registration", () => {
	it("registers the html export format during compilePlugins", async () => {
		const runtime = await compilePlugins([createHtmlExportPlugin()], makeCtx());

		expect(runtime.exportFormats.has("html")).toBe(true);
	});

	it("runs the registered html format and returns page.html", async () => {
		const runtime = await compilePlugins([createHtmlExportPlugin()], makeCtx());
		const format = runtime.exportFormats.get("html");

		expect(format).toBeDefined();

		if (!format) {
			throw new Error("Expected html export format to be registered");
		}

		const result = await format.run(heroFixture, {});

		expect(result.content).toContain("<!doctype html>");
		expect(result.filename).toBe("page.html");
	});

	it("contributes the export-html header action", async () => {
		const runtime = await compilePlugins([createHtmlExportPlugin()], makeCtx());

		expect(
			runtime.headerActions.some((action) => action.id === "export-html"),
		).toBe(true);
	});
});
