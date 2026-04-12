import type { StudioHeaderAction } from "@anvilkit/core/types";

export const exportHtmlHeaderAction: StudioHeaderAction = {
	id: "export-html",
	label: "Download HTML",
	icon: "download",
	group: "secondary",
	order: 100,
	onClick: async (ctx) => {
		// TODO(phase3-014): wire this to the host app's exportAs("html") path.
		// For phase3-010 this remains a visible placeholder proving header contribution wiring.
		ctx.log(
			"info",
			"HTML export clicked; host must wire exportAs (phase3-014).",
		);
	},
};
