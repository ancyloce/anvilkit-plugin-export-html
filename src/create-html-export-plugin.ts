import type {
  ExportFormatDefinition,
  StudioPlugin,
  StudioPluginMeta,
} from "@anvilkit/core/types";

import packageJson from "../package.json";
import { htmlFormat } from "./format-definition.js";
import { createExportHtmlHeaderAction } from "./header-action.js";
import type { HtmlExportOptions } from "./types.js";

const htmlExportPluginMeta: StudioPluginMeta = {
  id: "anvilkit-plugin-export-html",
  name: "HTML Export",
  // Derived from package.json so a Changesets bump can never drift the
  // runtime metadata; the metadata-drift test guards regressions.
  version: packageJson.version,
  coreVersion: "^0.1.0-alpha",
  description: "Export Puck pages as standalone HTML documents.",
};

export function createHtmlExportPlugin(
  opts: HtmlExportOptions = {},
): StudioPlugin {
  const boundFormat: ExportFormatDefinition<HtmlExportOptions> = {
    id: htmlFormat.id,
    label: htmlFormat.label,
    extension: htmlFormat.extension,
    mimeType: htmlFormat.mimeType,
    run: (ir, runtimeOpts, runCtx) =>
      htmlFormat.run(ir, { ...opts, ...runtimeOpts }, runCtx),
  };
  const shouldRegisterHeaderAction =
    opts.headerAction ?? opts.buildIR !== undefined;

  return {
    meta: htmlExportPluginMeta,
    register(ctx) {
      const headerActions = shouldRegisterHeaderAction
        ? [
            createExportHtmlHeaderAction(boundFormat, opts, {
              getAssetResolvers: ctx.getAssetResolvers,
            }),
          ]
        : [];

      return {
        meta: htmlExportPluginMeta,
        exportFormats: [boundFormat],
        ...(headerActions.length > 0 ? { headerActions } : {}),
      };
    },
  };
}
