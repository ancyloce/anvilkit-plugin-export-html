import { escapeAttr, escapeHtml } from "./internal/escape-html.js";

const DEFAULT_LANG = "en";

export function wrapDocument(opts: {
	title: string;
	css: string;
	bodyHtml: string;
	lang?: string;
	description?: string;
}): string {
	const trimmedCss = opts.css.trimStart();
	const cssBlock =
		trimmedCss.startsWith("<style") || trimmedCss.startsWith("<link")
			? opts.css
			: "<style>" + opts.css + "</style>";

	const lang =
		typeof opts.lang === "string" && opts.lang.trim() !== ""
			? opts.lang.trim()
			: DEFAULT_LANG;

	const descriptionMeta =
		typeof opts.description === "string" && opts.description.trim() !== ""
			? '<meta name="description" content="' +
				escapeAttr(opts.description) +
				'">'
			: "";

	return (
		"<!doctype html>" +
		'<html lang="' +
		escapeAttr(lang) +
		'">' +
		"<head>" +
		'<meta charset="utf-8">' +
		'<meta name="viewport" content="width=device-width, initial-scale=1">' +
		"<title>" +
		escapeHtml(opts.title) +
		"</title>" +
		descriptionMeta +
		cssBlock +
		"</head>" +
		"<body>" +
		opts.bodyHtml +
		"</body>" +
		"</html>"
	);
}
