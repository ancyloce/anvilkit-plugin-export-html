import { escapeHtml } from "./internal/escape-html.js";

export function wrapDocument(opts: {
	title: string;
	css: string;
	bodyHtml: string;
}): string {
	const trimmedCss = opts.css.trimStart();
	const cssBlock =
		trimmedCss.startsWith("<style") || trimmedCss.startsWith("<link")
			? opts.css
			: "<style>" + opts.css + "</style>";

	return (
		"<!doctype html>" +
		'<html lang="en">' +
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
