import { escapeAttr, escapeHtml } from "./internal/escape-html.js";

const DEFAULT_LANG = "en";

export function wrapDocument(opts: {
	title: string;
	css: string;
	bodyHtml: string;
	lang?: string;
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
		cssBlock +
		"</head>" +
		"<body>" +
		opts.bodyHtml +
		"</body>" +
		"</html>"
	);
}
