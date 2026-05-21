import type { PageIR } from "@anvilkit/core/types";

export const statisticsFixture: PageIR = {
	version: "1",
	root: {
		id: "root",
		type: "__root__",
		props: {},
		children: [
			{
				id: "statistics-1",
				type: "Statistics",
				props: {
					title: "Export metrics",
					items: [
						{ value: "31", label: "existing tests" },
						{ value: "9", label: "fixture modules" },
						{ value: "1", label: "alt warning added" },
					],
				},
			},
		],
	},
	assets: [],
	metadata: {
		createdAt: "2026-04-11T00:00:00.000Z",
	},
};
