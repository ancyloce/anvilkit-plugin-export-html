import type { PageIRAsset } from "@anvilkit/core/types";
import { describe, expect, it, vi } from "vitest";
import { inlineAssets } from "../inline-assets.js";
import { encodeBase64 } from "../internal/base64.js";

const pngBytes = new Uint8Array([
	0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

describe("inlineAssets", () => {
	it("inlines image assets under the threshold", async () => {
		const assets: PageIRAsset[] = [
			{
				kind: "image",
				id: "img1",
				url: "https://cdn.example/a.png",
			},
		];

		const result = await inlineAssets(assets, {
			thresholdBytes: 1024,
			fetchAsset: async () => ({
				bytes: pngBytes,
				contentType: "image/png",
			}),
		});

		expect(result.inlined.get("img1")).toBe(
			`data:image/png;base64,${encodeBase64(pngBytes)}`,
		);
		expect(result.warnings).toEqual([]);
	});

	it("warns instead of inlining images over the threshold", async () => {
		const assets: PageIRAsset[] = [
			{
				kind: "image",
				id: "img1",
				url: "https://cdn.example/a.png",
			},
		];

		const result = await inlineAssets(assets, {
			thresholdBytes: 4,
			fetchAsset: async () => ({
				bytes: pngBytes,
				contentType: "image/png",
			}),
		});

		expect(result.inlined.size).toBe(0);
		expect(result.warnings).toHaveLength(1);
		expect(result.warnings[0]).toMatchObject({
			code: "MISSING_INLINE",
			level: "warn",
		});
	});

	it("reports fetch failures as warnings", async () => {
		const assets: PageIRAsset[] = [
			{
				kind: "image",
				id: "img1",
				url: "https://cdn.example/a.png",
			},
		];
		const fetchAsset = vi.fn().mockRejectedValue(new Error("boom"));

		const result = await inlineAssets(assets, {
			thresholdBytes: 1024,
			fetchAsset,
		});

		expect(result.inlined.size).toBe(0);
		expect(result.warnings).toHaveLength(1);
		expect(result.warnings[0]).toMatchObject({
			code: "ASSET_FETCH_FAILED",
			level: "warn",
		});
		expect(result.warnings[0]?.message).toContain("boom");
	});

	it("skips non-image assets without fetching, but warns", async () => {
		const assets: PageIRAsset[] = [
			{
				kind: "font",
				id: "f1",
				url: "https://cdn.example/font.woff2",
			},
		];
		const fetchAsset = vi.fn();

		const result = await inlineAssets(assets, {
			thresholdBytes: 1024,
			fetchAsset,
		});

		expect(fetchAsset).not.toHaveBeenCalled();
		expect(result.inlined.size).toBe(0);
		expect(result.warnings).toHaveLength(1);
		expect(result.warnings[0]).toMatchObject({
			code: "UNINLINEABLE_ASSET_KIND",
			level: "warn",
		});
		expect(result.warnings[0]?.message).toContain("font");
	});

	it("fetches multiple image assets concurrently", async () => {
		const assets: PageIRAsset[] = [
			{ kind: "image", id: "img1", url: "https://cdn.example/a.png" },
			{ kind: "image", id: "img2", url: "https://cdn.example/b.png" },
			{ kind: "image", id: "img3", url: "https://cdn.example/c.png" },
		];

		let inFlight = 0;
		let maxInFlight = 0;
		const fetchAsset = vi.fn(async () => {
			inFlight += 1;
			maxInFlight = Math.max(maxInFlight, inFlight);
			await new Promise((resolve) => setTimeout(resolve, 5));
			inFlight -= 1;
			return { bytes: pngBytes, contentType: "image/png" };
		});

		const result = await inlineAssets(assets, {
			thresholdBytes: 1024,
			fetchAsset,
		});

		expect(result.inlined.size).toBe(3);
		expect(maxInFlight).toBeGreaterThan(1);
	});
});
