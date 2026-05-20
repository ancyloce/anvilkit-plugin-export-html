import type { PageIRAsset } from "@anvilkit/core/types";
import { afterEach, describe, expect, it, vi } from "vitest";
import { htmlFormat } from "../format-definition.js";
import { defaultFetchAsset, inlineAssets } from "../inline-assets.js";
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

  it("only fetches assets whose ids appear in emittedAssetIds", async () => {
    const assets: PageIRAsset[] = [
      { kind: "image", id: "used", url: "https://cdn.example/a.png" },
      { kind: "image", id: "unused", url: "https://cdn.example/b.png" },
    ];
    const fetchAsset = vi.fn(async () => ({
      bytes: pngBytes,
      contentType: "image/png",
    }));

    const result = await inlineAssets(assets, {
      thresholdBytes: 1024,
      fetchAsset,
      emittedAssetIds: new Set(["used"]),
    });

    expect(fetchAsset).toHaveBeenCalledTimes(1);
    expect(fetchAsset).toHaveBeenCalledWith(
      "https://cdn.example/a.png",
      expect.objectContaining({ maxBytes: 1024 }),
    );
    expect(result.inlined.has("used")).toBe(true);
    expect(result.inlined.has("unused")).toBe(false);
  });

  it("inlines no assets when emittedAssetIds is empty", async () => {
    const assets: PageIRAsset[] = [
      { kind: "image", id: "img1", url: "https://cdn.example/a.png" },
    ];
    const fetchAsset = vi.fn();

    const result = await inlineAssets(assets, {
      thresholdBytes: 1024,
      fetchAsset,
      emittedAssetIds: new Set(),
    });

    expect(fetchAsset).not.toHaveBeenCalled();
    expect(result.inlined.size).toBe(0);
  });

  it("does not fetch emitted assets unless a fetchAsset callback is supplied", async () => {
    const realFetch = globalThis.fetch;
    const fetch = vi.fn();
    globalThis.fetch = fetch as unknown as typeof globalThis.fetch;
    try {
      const result = await htmlFormat.run(
        {
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
                      description: "No implicit fetch.",
                      imageSrc: "https://cdn.example/a.png",
                      imageAlt: "Launch image",
                    },
                  ],
                },
              },
            ],
          },
          assets: [
            { kind: "image", id: "img1", url: "https://cdn.example/a.png" },
          ],
          metadata: {},
        },
        {},
      );

      expect(fetch).not.toHaveBeenCalled();
      expect(result.content).toContain('src="https://cdn.example/a.png"');
      expect(result.warnings).toEqual([]);
    } finally {
      globalThis.fetch = realFetch;
    }
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

  it("blocks the default fetcher from non-http(s) schemes", async () => {
    const assets: PageIRAsset[] = [
      { kind: "image", id: "img1", url: "file:///etc/passwd" },
    ];

    const result = await inlineAssets(assets, {
      thresholdBytes: 1024,
      fetchAsset: defaultFetchAsset,
      emittedAssetIds: new Set(["img1"]),
    });

    expect(result.inlined.size).toBe(0);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toMatchObject({
      code: "ASSET_FETCH_BLOCKED",
      level: "warn",
    });
  });
});

describe("defaultFetchAsset", () => {
  const realFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it("rejects when Content-Length advertises a payload over the cap", async () => {
    globalThis.fetch = vi.fn(
      async () =>
        new Response(new Uint8Array(8), {
          status: 200,
          headers: {
            "content-type": "image/png",
            "content-length": "1048576",
          },
        }),
    ) as unknown as typeof fetch;

    await expect(
      defaultFetchAsset("https://cdn.example/big.png", { maxBytes: 1024 }),
    ).rejects.toThrow(/Content-Length/);
  });

  it("rejects when streamed body exceeds the cap mid-flight", async () => {
    const bigChunk = new Uint8Array(2048);
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bigChunk);
        controller.close();
      },
    });
    globalThis.fetch = vi.fn(
      async () =>
        new Response(stream, {
          status: 200,
          headers: { "content-type": "image/png" },
        }),
    ) as unknown as typeof fetch;

    await expect(
      defaultFetchAsset("https://cdn.example/streamed.png", {
        maxBytes: 1024,
      }),
    ).rejects.toThrow(/streamed body/);
  });

  it("refuses non-http(s) URLs outright", async () => {
    await expect(defaultFetchAsset("file:///etc/passwd")).rejects.toThrow(
      /refused to fetch/,
    );
  });
});
