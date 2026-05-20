import type { PageIR } from "@anvilkit/core/types";
import { describe, expect, it } from "vitest";

import { makeEmitContext, renderImage } from "../emit-html.js";
import { htmlFormat } from "../format-definition.js";
import { blogListFixture } from "./__fixtures__/blog-list.fixture.js";

describe("html export warnings", () => {
  it("emits MISSING_ALT when renderImage receives a blank alt", () => {
    const ctx = makeEmitContext();
    renderImage(
      "https://example.com/logo.png",
      "",
      ctx,
      ' class="ak-test-image"',
    );
    expect(ctx.warnings.some((w) => w.code === "MISSING_ALT")).toBe(true);
  });

  it("attaches nodeId to MISSING_ALT when raised inside an emitter", () => {
    const ctx = makeEmitContext();
    const scoped = { ...ctx, currentNodeId: "navbar-42" };
    renderImage("https://example.com/logo.png", "", scoped, "");
    // The warning is pushed onto the shared array, so it is visible
    // on the original ctx.
    const missingAlt = ctx.warnings.find((w) => w.code === "MISSING_ALT");
    expect(missingAlt).toBeDefined();
    expect(missingAlt?.nodeId).toBe("navbar-42");
  });

  it("emits ASSET_FETCH_FAILED when asset fetching rejects", async () => {
    const result = await htmlFormat.run(blogListFixture, {
      fetchAsset: async () => {
        throw new Error("boom");
      },
    });
    expect(result.warnings.some((w) => w.code === "ASSET_FETCH_FAILED")).toBe(
      true,
    );
  });

  it("emits UNKNOWN_COMPONENT_EMITTER for unsupported nodes", async () => {
    const ir: PageIR = {
      version: "1",
      root: {
        id: "root",
        type: "__root__",
        props: {},
        children: [{ id: "unknown-1", type: "NotARealComponent", props: {} }],
      },
      assets: [],
      metadata: {},
    };
    const result = await htmlFormat.run(ir, {});
    expect(
      result.warnings.some((w) => w.code === "UNKNOWN_COMPONENT_EMITTER"),
    ).toBe(true);
  });
});
