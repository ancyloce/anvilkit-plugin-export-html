import type { PageIR } from "@anvilkit/core/types";

export const logoCloudsFixture: PageIR = {
	version: "1",
	root: {
		id: "root",
		type: "__root__",
		props: {},
		children: [
			{
				id: "logo-clouds-1",
				type: "LogoClouds",
				props: {
					title: "Used by release teams",
					subtitle:
						"Stable fixture coverage for every supported marketing block.",
				},
			},
		],
	},
	assets: [],
	metadata: {
		createdAt: "2026-04-11T00:00:00.000Z",
	},
};
