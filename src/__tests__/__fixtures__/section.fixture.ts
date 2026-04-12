import type { PageIR } from "@anvilkit/core/types";

export const sectionFixture: PageIR = {
	version: "1",
	root: {
		id: "root",
		type: "__root__",
		props: {},
		children: [
			{
				id: "section-1",
				type: "Section",
				props: {
					badgeLabel: "Release note",
					headline: "Stable exports",
					highlightedHeadline: "without regressions",
					description:
						"Each fixture targets only the prop names the emitter reads.",
				},
			},
		],
	},
	assets: [],
	metadata: {
		createdAt: "2026-04-11T00:00:00.000Z",
	},
};
