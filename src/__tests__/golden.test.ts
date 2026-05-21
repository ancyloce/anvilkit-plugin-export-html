import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";
import { htmlFormat } from "../format/format-definition.js";
import { bentoGridFixture } from "./__fixtures__/bento-grid.fixture.js";
import { blogListFixture } from "./__fixtures__/blog-list.fixture.js";
import { helpsFixture } from "./__fixtures__/helps.fixture.js";
import { heroFixture } from "./__fixtures__/hero.fixture.js";
import { logoCloudsFixture } from "./__fixtures__/logo-clouds.fixture.js";
import { navbarFixture } from "./__fixtures__/navbar.fixture.js";
import { pricingMinimalFixture } from "./__fixtures__/pricing-minimal.fixture.js";
import { sectionFixture } from "./__fixtures__/section.fixture.js";
import { statisticsFixture } from "./__fixtures__/statistics.fixture.js";

const fetchAsset = async () => ({
	bytes: new Uint8Array([1, 2, 3, 4]),
	contentType: "image/jpeg",
});

const fixtures = [
	["hero", "Hero", heroFixture],
	["navbar", "Navbar", navbarFixture],
	["pricing-minimal", "Pricing Minimal", pricingMinimalFixture],
	["bento-grid", "Bento Grid", bentoGridFixture],
	["section", "Section", sectionFixture],
	["statistics", "Statistics", statisticsFixture],
	["blog-list", "Blog List", blogListFixture],
	["helps", "Helps", helpsFixture],
	["logo-clouds", "Logo Clouds", logoCloudsFixture],
] as const;

it.each(
	fixtures,
)("renders %s fixture to a stable html document", async (slug, title, fixture) => {
	const result = await htmlFormat.run(fixture, {
		inlineStyles: true,
		inlineAssetThresholdBytes: 0,
		title,
		fetchAsset,
	});

	expect(result.content).toMatchFileSnapshot(
		fileURLToPath(
			new URL(`./__snapshots__/${slug}.snap.html`, import.meta.url),
		),
	);
});
