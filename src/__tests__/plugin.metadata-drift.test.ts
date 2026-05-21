import { describe, expect, it } from "vitest";

import packageJson from "../../package.json";
import { createHtmlExportPlugin } from "../plugin.js";

/**
 * Metadata drift guard: `META.version` is derived from package.json, so
 * a Changesets bump can never leave the runtime metadata stale.
 */
describe("plugin metadata drift", () => {
	it("meta.version matches package.json version", () => {
		const plugin = createHtmlExportPlugin();
		expect(plugin.meta.version).toBe(packageJson.version);
	});
});
