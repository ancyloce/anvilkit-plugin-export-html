import { StudioConfigSchema } from "@anvilkit/core";
import type {
	PageIR,
	StudioPluginContext,
} from "@anvilkit/core/types";
import { describe, expect, it, vi } from "vitest";

import { createHtmlExportPlugin } from "../create-html-export-plugin.js";
import { exportHtmlHeaderAction } from "../header-action.js";

const studioConfig = StudioConfigSchema.parse({});

function makeCtx(): StudioPluginContext {
	return {
		getData: () => ({ root: { props: {} }, content: [], zones: {} }),
		getPuckApi: (() => {
			throw new Error("getPuckApi should not be invoked in this test");
		}) as unknown as StudioPluginContext["getPuckApi"],
		studioConfig,
		log: vi.fn(),
		emit: vi.fn(),
		registerAssetResolver: vi.fn(),
	};
}

function makeHeroIr(): PageIR {
	return {
		version: "1",
		root: {
			id: "root",
			type: "__root__",
			props: {},
			children: [{ id: "hero-1", type: "Hero", props: { headline: "Hi" } }],
		},
		assets: [],
		metadata: {},
	};
}

describe("export header action wiring", () => {
	it("does not register a header action by default when buildIR is not provided", async () => {
		const plugin = createHtmlExportPlugin({ title: "Page" });
		const ctx = makeCtx();
		const registration = await plugin.register(ctx);

		expect(registration.headerActions ?? []).toEqual([]);
	});

	it("can opt into a request-only header action without buildIR", async () => {
		const plugin = createHtmlExportPlugin({ title: "Page", headerAction: true });
		const ctx = makeCtx();
		const registration = await plugin.register(ctx);
		const action = registration.headerActions?.[0];

		if (!action) {
			throw new Error("Expected a header action");
		}

		await action.onClick(ctx);

		const emit = ctx.emit as ReturnType<typeof vi.fn>;
		expect(emit).toHaveBeenCalledWith(
			"anvilkit:export:request",
			expect.objectContaining({ formatId: "html" }),
		);
	});

	it("keeps the default unbound header action request-only", async () => {
		const ctx = makeCtx();

		await exportHtmlHeaderAction.onClick(ctx);

		const emit = ctx.emit as ReturnType<typeof vi.fn>;
		expect(emit).toHaveBeenCalledWith("anvilkit:export:request", {
			formatId: "html",
			options: {},
		});
	});

	it("runs the export and emits anvilkit:export:ready when buildIR is provided", async () => {
		const buildIR = vi.fn(() => makeHeroIr());
		const plugin = createHtmlExportPlugin({
			title: "Page",
			buildIR,
		});
		const ctx = makeCtx();
		const registration = await plugin.register(ctx);
		const action = registration.headerActions?.[0];

		if (!action) {
			throw new Error("Expected a header action");
		}

		await action.onClick(ctx);

		expect(buildIR).toHaveBeenCalledWith(ctx);
		const emit = ctx.emit as ReturnType<typeof vi.fn>;
		expect(emit).toHaveBeenCalledWith(
			"anvilkit:export:ready",
			expect.objectContaining({
				formatId: "html",
				filename: "page.html",
				mimeType: "text/html",
			}),
		);
		const payload = emit.mock.calls.find(
			(call) => call[0] === "anvilkit:export:ready",
		)?.[1] as { content: string } | undefined;
		expect(payload?.content).toContain("<title>Page</title>");
	});

	it("forwards registered assetResolvers when running with buildIR", async () => {
		const ir: PageIR = {
			version: "1",
			root: {
				id: "root",
				type: "__root__",
				props: {},
				children: [
					{
						id: "blog-1",
						type: "BlogList",
						props: {
							posts: [
								{
									title: "Launch",
									description: "Resolved via plugin assetResolvers.",
									imageSrc: "asset://logo",
									imageAlt: "Logo",
								},
							],
						},
					},
				],
			},
			assets: [{ id: "logo", kind: "image", url: "asset://logo" }],
			metadata: {},
		};
		const resolver = vi.fn((url: string) =>
			url === "asset://logo"
				? { url: "https://cdn.example/logo.png" }
				: null,
		);
		const plugin = createHtmlExportPlugin({
			buildIR: () => ir,
			fetchAsset: vi.fn().mockRejectedValue(new Error("skip inline")),
		});
		const ctx: StudioPluginContext = {
			...makeCtx(),
			getAssetResolvers: () => [resolver],
		};
		const registration = await plugin.register(ctx);
		const action = registration.headerActions?.[0];

		if (!action) {
			throw new Error("Expected a header action");
		}

		await action.onClick(ctx);

		expect(resolver).toHaveBeenCalledWith("asset://logo");
		const emit = ctx.emit as ReturnType<typeof vi.fn>;
		const payload = emit.mock.calls.find(
			(call) => call[0] === "anvilkit:export:ready",
		)?.[1] as { content: string } | undefined;
		expect(payload?.content).toContain("https://cdn.example/logo.png");
		expect(payload?.content).not.toContain("asset://logo");
	});

	it("logs and re-throws when buildIR throws", async () => {
		const failure = new Error("boom");
		const plugin = createHtmlExportPlugin({
			buildIR: () => {
				throw failure;
			},
		});
		const ctx = makeCtx();
		const registration = await plugin.register(ctx);
		const action = registration.headerActions?.[0];

		if (!action) {
			throw new Error("Expected a header action");
		}

		await expect(action.onClick(ctx)).rejects.toThrow("boom");
		const log = ctx.log as ReturnType<typeof vi.fn>;
		expect(log).toHaveBeenCalledWith(
			"error",
			expect.stringContaining("HTML export failed"),
			expect.objectContaining({ message: "boom" }),
		);
	});
});
