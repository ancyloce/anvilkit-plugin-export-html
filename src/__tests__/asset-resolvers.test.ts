import type { PageIR, PageIRNode } from "@anvilkit/core/types";
import { describe, expect, it, vi } from "vitest";
import { resolveHtmlAssetUrls } from "../asset/resolve-assets.js";
import { htmlFormat } from "../format/format-definition.js";

function createBlogIr(url: string): PageIR {
	return {
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
								title: "Launch notes",
								description: "Everything changed safely.",
								imageSrc: url,
								imageAlt: "Release image",
							},
						],
					},
				},
			],
		},
		assets: [{ id: "asset-1", kind: "image", url }],
		metadata: {},
	};
}

describe("htmlFormat asset resolvers", () => {
	it("rewrites asset:// image URLs before export", async () => {
		const result = await htmlFormat.run(
			createBlogIr("asset://asset-1"),
			{
				fetchAsset: vi.fn().mockRejectedValue(new Error("skip inline")),
			},
			{
				assetResolvers: [
					(url) =>
						url === "asset://asset-1"
							? { url: "https://cdn.example.com/upload.png" }
							: null,
				],
			},
		);

		expect(result.content).toContain(
			'src="https://cdn.example.com/upload.png"',
		);
		expect(result.content).not.toContain("asset://");
	});

	it("omits hostile resolved URLs and emits ASSET_UNRESOLVED", async () => {
		const result = await htmlFormat.run(
			createBlogIr("asset://asset-1"),
			{},
			{
				assetResolvers: [
					(url) =>
						url === "asset://asset-1" ? { url: "javascript:alert(1)" } : null,
				],
			},
		);

		expect(result.content).not.toContain("javascript:");
		expect(result.content).not.toContain("asset://");
		expect(
			result.warnings?.some((warning) => warning.code === "ASSET_UNRESOLVED"),
		).toBe(true);
	});

	it("preserves slot and slotKind on cloned nodes when rewriting", async () => {
		const childWithSlot: PageIRNode = {
			id: "blog-1",
			type: "BlogList",
			props: {
				posts: [
					{
						title: "Launch",
						description: "Everything changed safely.",
						imageSrc: "asset://asset-1",
						imageAlt: "Release image",
					},
				],
			},
			slot: "main",
			slotKind: "slot",
		};
		const ir: PageIR = {
			version: "1",
			root: {
				id: "root",
				type: "__root__",
				props: {},
				children: [childWithSlot],
			},
			assets: [{ id: "asset-1", kind: "image", url: "asset://asset-1" }],
			metadata: {},
		};

		const { ir: rewritten } = await resolveHtmlAssetUrls(ir, [
			(url) =>
				url === "asset://asset-1"
					? { url: "https://cdn.example.com/upload.png" }
					: null,
		]);

		expect(rewritten.root.children?.[0]?.slot).toBe("main");
		expect(rewritten.root.children?.[0]?.slotKind).toBe("slot");
	});

	it("clones asset.meta so resolving does not freeze caller-owned metadata", async () => {
		const meta = { width: 1600, height: 900 };
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
									description: "Everything changed safely.",
									imageSrc: "asset://asset-1",
									imageAlt: "Release image",
								},
							],
						},
					},
				],
			},
			assets: [{ id: "asset-1", kind: "image", url: "asset://asset-1", meta }],
			metadata: {},
		};

		await resolveHtmlAssetUrls(ir, [
			(url) =>
				url === "asset://asset-1"
					? { url: "https://cdn.example.com/upload.png" }
					: null,
		]);

		// Caller-owned meta object must not be frozen as a side effect
		// of running asset resolution.
		expect(Object.isFrozen(meta)).toBe(false);
		// And it must still be mutable.
		expect(() => {
			(meta as { width: number }).width = 1280;
		}).not.toThrow();
	});

	it("allows safe raster image data URLs from resolvers", async () => {
		const dataUrl = "data:image/png;base64,aGVsbG8=";
		const result = await htmlFormat.run(
			createBlogIr("asset://asset-1"),
			{
				fetchAsset: vi.fn().mockRejectedValue(new Error("skip inline")),
			},
			{
				assetResolvers: [
					(url) => (url === "asset://asset-1" ? { url: dataUrl } : null),
				],
			},
		);

		expect(result.content).toContain('src="data:image/png;base64,');
		expect(result.content).not.toContain("asset://");
	});
});
