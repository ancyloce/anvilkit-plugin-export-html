import type { PageIR, PageIRNode } from "@anvilkit/core/types";
import { Window } from "happy-dom";
import { describe, expect, it } from "vitest";
import { htmlFormat } from "../format-definition.js";
import { blogListFixture } from "./__fixtures__/blog-list.fixture.js";
import { heroFixture } from "./__fixtures__/hero.fixture.js";
import { pricingMinimalFixture } from "./__fixtures__/pricing-minimal.fixture.js";

const stubFetch = async () => ({
  bytes: new Uint8Array([1, 2, 3, 4]),
  contentType: "image/jpeg",
});

async function renderDocument(fixture: PageIR) {
  const { content } = await htmlFormat.run(fixture, {
    inlineStyles: true,
    inlineAssetThresholdBytes: 0,
    fetchAsset: stubFetch,
  });
  const window = new Window();

  window.document.write(content);
  window.document.close();

  return window.document;
}

function makePricingFixtureWithFeatures(): PageIR {
  const pricingNode = pricingMinimalFixture.root.children?.[0];

  if (!pricingNode) {
    throw new Error(
      "Expected pricing fixture to include a PricingMinimal node",
    );
  }

  const planProps = Array.isArray(pricingNode.props.plans)
    ? pricingNode.props.plans
    : [];
  const starterPlan = (planProps[0] ?? {}) as Record<string, unknown>;
  const teamPlan = (planProps[1] ?? {}) as Record<string, unknown>;

  const nextNode: PageIRNode = {
    ...pricingNode,
    props: {
      ...pricingNode.props,
      plans: [
        {
          ...starterPlan,
          features: [
            { label: "Priority support" },
            { label: "Unlimited exports" },
          ],
        },
        {
          ...teamPlan,
          extraFeatures: [{ label: "Custom domains" }],
        },
      ],
    },
  };

  return {
    ...pricingMinimalFixture,
    root: {
      ...pricingMinimalFixture.root,
      children: [nextNode],
    },
  };
}

describe("html round-trip parsing", () => {
  it("preserves hero headline content", async () => {
    const document = await renderDocument(heroFixture);

    expect(document.querySelector(".ak-hero__headline")?.textContent).toContain(
      "Ship updates without friction.",
    );
  });

  it("preserves pricing feature list items", async () => {
    const document = await renderDocument(makePricingFixtureWithFeatures());
    const featureItems = Array.from(
      document.querySelectorAll(".ak-pricing-minimal__card li"),
    ).map((item) => item.textContent?.trim() ?? "");

    expect(featureItems).toEqual(
      expect.arrayContaining([
        "Priority support",
        "Unlimited exports",
        "Custom domains",
      ]),
    );
  });

  it("preserves blog post titles", async () => {
    const document = await renderDocument(blogListFixture);
    const titles = Array.from(
      document.querySelectorAll(".ak-blog-list__title"),
    ).map((node) => node.textContent?.trim() ?? "");

    expect(titles).toContain("Phase 3 fixtures");
  });
});
