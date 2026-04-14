import { defineConfig } from "@rslib/core";

/**
 * Bundleless build for `@anvilkit/plugin-export-html`.
 *
 * Each `.ts` under `src/` becomes an individual ESM + CJS output in
 * `dist/`, matching `@anvilkit/ir`'s layout. `@anvilkit/core`,
 * `@anvilkit/ir`, `@anvilkit/utils`, `@puckeditor/core`, `react`,
 * and `react-dom` are all left external so the package stays aligned
 * with its dependency contract while phase3-009 only ships a headless
 * scaffold.
 */
export default defineConfig({
	source: {
		entry: {
			index: [
				"./src/**/*.ts",
				"!./src/**/*.{test,spec}.ts",
				"!./src/**/__tests__/**",
			],
		},
	},
	lib: [
		{
			bundle: false,
			dts: {
				autoExtension: true,
			},
			format: "esm",
		},
		{
			bundle: false,
			dts: {
				autoExtension: true,
			},
			format: "cjs",
		},
	],
	output: {
		target: "node",
		externals: [
			"@anvilkit/core",
			"@anvilkit/ir",
			"@anvilkit/utils",
			"@puckeditor/core",
			"react",
			"react-dom",
		],
	},
});
