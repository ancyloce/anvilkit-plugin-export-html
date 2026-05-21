import type { ExportWarning, PageIR, PageIRNode } from "@anvilkit/core/types";

import { escapeAttr, escapeHtml } from "../internal/escape-html.js";
import type { HtmlExportOptions } from "../types/types.js";

type PropRecord = Readonly<Record<string, unknown>>;

interface AssetLookupContext {
	readonly assetIdsByUrl?: ReadonlyMap<string, string>;
}

export interface EmitContext extends AssetLookupContext {
	readonly usedClassnames: Set<string>;
	readonly warnings: ExportWarning[];
	readonly currentNodeId?: string;
	/**
	 * Asset ids that have been emitted into the markup as
	 * `data-asset-id` markers. Populated by {@link renderImage} so the
	 * format can scope inlining to only those ids that actually appear
	 * in the output.
	 */
	readonly emittedAssetIds?: Set<string>;
}

const LOGO_CLOUD_DEFAULT_ITEMS = [
	{
		label: "React",
		src: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg",
	},
	{
		label: "Tailwind CSS",
		src: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tailwindcss/tailwindcss-original.svg",
	},
	{
		label: "Docker",
		src: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/docker/docker-original.svg",
	},
	{
		label: "Node.js",
		src: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg",
	},
	{
		label: "GraphQL",
		src: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/graphql/graphql-plain.svg",
	},
] as const;

const EMITTERS: Readonly<
	Record<string, (node: PageIRNode, ctx: EmitContext) => string>
> = {
	hero: emitHero,
	Hero: emitHero,
	navbar: emitNavbar,
	Navbar: emitNavbar,
	"pricing-minimal": emitPricingMinimal,
	PricingMinimal: emitPricingMinimal,
	"bento-grid": emitBentoGrid,
	BentoGrid: emitBentoGrid,
	section: emitSection,
	Section: emitSection,
	statistics: emitStatistics,
	Statistics: emitStatistics,
	"blog-list": emitBlogList,
	BlogList: emitBlogList,
	helps: emitHelps,
	Helps: emitHelps,
	"logo-clouds": emitLogoClouds,
	LogoClouds: emitLogoClouds,
};

export function makeEmitContext(): EmitContext {
	return {
		usedClassnames: new Set(),
		warnings: [],
		emittedAssetIds: new Set(),
	};
}

export function emitHtml(
	ir: PageIR,
	opts: HtmlExportOptions,
	ctx: EmitContext,
): {
	html: string;
	usedClassnames: Set<string>;
	warnings: ExportWarning[];
	emittedAssetIds: Set<string>;
} {
	void opts;

	const emittedAssetIds = ctx.emittedAssetIds ?? new Set<string>();
	const runtimeCtx: EmitContext = {
		usedClassnames: ctx.usedClassnames,
		warnings: ctx.warnings,
		assetIdsByUrl: createAssetIdsByUrl(ir),
		emittedAssetIds,
	};

	const rootChildren = ir.root.children ?? [];
	const html = rootChildren.map((node) => emitNode(node, runtimeCtx)).join("");

	return {
		html,
		usedClassnames: ctx.usedClassnames,
		warnings: ctx.warnings,
		emittedAssetIds,
	};
}

function emitNode(node: PageIRNode, ctx: EmitContext): string {
	const emitter = EMITTERS[node.type];
	const scopedCtx: EmitContext = { ...ctx, currentNodeId: node.id };

	if (emitter) {
		// None of the registered emitters render `node.children` today
		// (the IR contract reserves `children` for slot/zone content but
		// no current emitter has a slot field). Warn loudly when a
		// supported component carries children that will be dropped so
		// the loss is visible instead of silent.
		if (node.children && node.children.length > 0) {
			ctx.warnings.push({
				level: "warn",
				code: "UNSUPPORTED_CHILDREN",
				message:
					'Component "' +
					node.type +
					'" has nested children that the HTML exporter does not render. ' +
					String(node.children.length) +
					" child node(s) were omitted from the output.",
				nodeId: node.id,
			});
		}

		return emitter(node, scopedCtx);
	}

	ctx.usedClassnames.add("ak-unknown");
	ctx.warnings.push({
		level: "warn",
		code: "UNKNOWN_COMPONENT_EMITTER",
		message:
			'No HTML emitter registered for component type "' + node.type + '".',
		nodeId: node.id,
	});

	return '<div class="ak-unknown"></div>';
}

function emitHero(node: PageIRNode, ctx: EmitContext): string {
	ctx.usedClassnames.add("ak-hero");

	const eyebrowLabel = getFirstString(node.props, [
		"announcementLabel",
		"eyebrow",
		"badgeLabel",
	]);
	const eyebrowHref = normalizeUrl(
		getFirstString(node.props, ["announcementHref"]),
	);
	const eyebrowOpenInNewTab = getBooleanProp(
		node.props,
		"announcementOpenInNewTab",
	);
	const headline = getFirstString(
		node.props,
		["headline", "title"],
		"Untitled Hero",
	);
	const description = getFirstString(node.props, [
		"description",
		"subtitle",
		"body",
	]);
	const linuxLabel = getFirstString(node.props, [
		"linuxLabel",
		"primaryCtaLabel",
	]);
	const linuxHref = normalizeUrl(
		getFirstString(node.props, ["linuxHref", "primaryCtaHref"]),
	);
	const linuxOpenInNewTab =
		getBooleanProp(node.props, "linuxOpenInNewTab") ||
		getBooleanProp(node.props, "primaryCtaOpenInNewTab");
	const windowsLabel = getFirstString(node.props, [
		"windowsLabel",
		"secondaryCtaLabel",
	]);
	const windowsHref = normalizeUrl(
		getFirstString(node.props, ["windowsHref", "secondaryCtaHref"]),
	);
	const windowsOpenInNewTab =
		getBooleanProp(node.props, "windowsOpenInNewTab") ||
		getBooleanProp(node.props, "secondaryCtaOpenInNewTab");
	const actions = [
		renderButtonLike(
			linuxLabel,
			linuxHref,
			linuxOpenInNewTab,
			"ak-hero__button",
		),
		renderButtonLike(
			windowsLabel,
			windowsHref,
			windowsOpenInNewTab,
			"ak-hero__button ak-hero__button--primary",
		),
	]
		.filter(Boolean)
		.join("");

	return (
		'<section class="ak-hero">' +
		'<div class="ak-hero__wrap">' +
		renderButtonLike(
			eyebrowLabel,
			eyebrowHref,
			eyebrowOpenInNewTab,
			"ak-hero__eyebrow",
		) +
		'<h1 class="ak-hero__headline">' +
		escapeHtml(headline) +
		"</h1>" +
		'<p class="ak-hero__description">' +
		escapeHtml(description) +
		"</p>" +
		(actions ? '<div class="ak-hero__actions">' + actions + "</div>" : "") +
		"</div>" +
		"</section>"
	);
}

function emitNavbar(node: PageIRNode, ctx: EmitContext): string {
	ctx.usedClassnames.add("ak-navbar");

	const logo = getRecordProp(node.props, "logo");
	const items = getRecordArrayProp(node.props, "items");
	const actions = getRecordArrayProp(node.props, "actions");
	const active = getStringProp(node.props, "active");
	const logoHref = normalizeUrl(getStringFromRecord(logo, "href"));
	let logoContent = "";

	if (getStringFromRecord(logo, "type") === "image") {
		logoContent = renderImage(
			getStringFromRecord(logo, "imageUrl"),
			getFirstString(logo, ["alt", "text"], "Logo"),
			ctx,
			' class="ak-navbar__logo-image"',
		);
	}

	if (!logoContent) {
		logoContent = escapeHtml(getFirstString(logo, ["text"], "Brand"));
	}

	const brand = logoHref
		? '<a class="ak-navbar__brand"' +
			renderHrefAttributes(logoHref, false) +
			">" +
			logoContent +
			"</a>"
		: '<div class="ak-navbar__brand">' + logoContent + "</div>";

	const menu = items.length
		? '<ul class="ak-navbar__menu">' +
			items
				.map((item) => {
					const label = getFirstString(item, ["label"], "Link");
					const href = normalizeUrl(getStringFromRecord(item, "href"));
					const current =
						href && active && href === active ? ' aria-current="page"' : "";

					if (!href) {
						return (
							"<li><span" + current + ">" + escapeHtml(label) + "</span></li>"
						);
					}

					return (
						"<li><a" +
						current +
						renderHrefAttributes(href, false) +
						">" +
						escapeHtml(label) +
						"</a></li>"
					);
				})
				.join("") +
			"</ul>"
		: "";

	const actionsHtml = actions.length
		? '<div class="ak-navbar__actions">' +
			actions
				.map((action) => {
					const label = getFirstString(action, ["label"], "Action");
					const href = normalizeUrl(getStringFromRecord(action, "href"));
					const disabled = getBooleanProp(action, "disabled");
					const openInNewTab = getBooleanProp(action, "openInNewTab");
					const variant = getFirstString(action, ["variant"], "secondary");

					if (!href || disabled) {
						return (
							'<button class="ak-navbar__action" data-variant="' +
							escapeAttr(variant) +
							'" type="button" disabled>' +
							escapeHtml(label) +
							"</button>"
						);
					}

					return (
						'<a class="ak-navbar__action" data-variant="' +
						escapeAttr(variant) +
						'"' +
						renderHrefAttributes(href, openInNewTab) +
						">" +
						escapeHtml(label) +
						"</a>"
					);
				})
				.join("") +
			"</div>"
		: "";

	return (
		'<nav class="ak-navbar" aria-label="Primary">' +
		'<div class="ak-navbar__wrap">' +
		brand +
		menu +
		actionsHtml +
		"</div>" +
		"</nav>"
	);
}

function emitPricingMinimal(node: PageIRNode, ctx: EmitContext): string {
	ctx.usedClassnames.add("ak-pricing-minimal");

	const headline = getFirstString(node.props, ["headline", "title"], "Pricing");
	const description = getFirstString(node.props, ["description", "subtitle"]);
	const plans = getRecordArrayProp(node.props, "plans");
	const cards = plans
		.map((plan) => {
			const name = getFirstString(plan, ["name"], "Plan");
			const planDescription = getFirstString(plan, ["description"]);
			const price = getFirstString(plan, ["price"], "$0");
			const billingPeriodLabel = getFirstString(plan, ["billingPeriodLabel"]);
			const badgeLabel = getFirstString(plan, ["badgeLabel"]);
			const featured = getBooleanProp(plan, "featured");
			const ctaLabel = getFirstString(plan, ["ctaLabel"], "Get started");
			const ctaHref = normalizeUrl(getStringFromRecord(plan, "ctaHref"));
			const ctaOpenInNewTab = getBooleanProp(plan, "ctaOpenInNewTab");
			const features = getRecordArrayProp(plan, "features");
			const extraFeatures = getRecordArrayProp(plan, "extraFeatures");

			return (
				'<article class="ak-pricing-minimal__card" data-featured="' +
				escapeAttr(String(featured)) +
				'">' +
				"<header><h3>" +
				escapeHtml(name) +
				"</h3>" +
				(badgeLabel
					? '<p class="ak-pricing-minimal__badge">' +
						escapeHtml(badgeLabel) +
						"</p>"
					: "") +
				"</header>" +
				(planDescription ? "<p>" + escapeHtml(planDescription) + "</p>" : "") +
				'<div class="ak-pricing-minimal__price">' +
				escapeHtml(price) +
				"</div>" +
				(billingPeriodLabel
					? "<p>" + escapeHtml(billingPeriodLabel) + "</p>"
					: "") +
				renderButtonLike(
					ctaLabel,
					ctaHref,
					ctaOpenInNewTab,
					"ak-pricing-minimal__button",
				) +
				renderFeatureList(features, "Included") +
				renderFeatureList(extraFeatures, "More") +
				"</article>"
			);
		})
		.join("");

	return (
		'<section class="ak-pricing-minimal">' +
		'<div class="ak-pricing-minimal__wrap">' +
		'<div class="ak-pricing-minimal__header">' +
		"<h2>" +
		escapeHtml(headline) +
		"</h2>" +
		"<p>" +
		escapeHtml(description) +
		"</p>" +
		"</div>" +
		(cards ? '<div class="ak-pricing-minimal__grid">' + cards + "</div>" : "") +
		"</div>" +
		"</section>"
	);
}

function emitBentoGrid(node: PageIRNode, ctx: EmitContext): string {
	ctx.usedClassnames.add("ak-bento-grid");

	const items = getRecordArrayProp(node.props, "items");
	const theme = getFirstString(node.props, ["theme"], "dark");
	const platform = getFirstString(node.props, ["platform"], "adaptive");
	const cards = items
		.map((item) => {
			const title = getFirstString(item, ["title"], "Card");
			const description = getFirstString(item, ["description"]);
			const icon = getFirstString(item, ["icon"], "•");
			const size = getFirstString(item, ["size"], "default");
			const ctaLabel = getFirstString(item, ["ctaLabel"], "Learn more");
			const ctaHref = normalizeUrl(getStringFromRecord(item, "ctaHref"));
			const ctaOpenInNewTab = getBooleanProp(item, "ctaOpenInNewTab");

			return (
				'<article class="ak-bento-grid__card" data-size="' +
				escapeAttr(size) +
				'">' +
				'<div class="ak-bento-grid__icon">' +
				escapeHtml(icon.slice(0, 1).toUpperCase()) +
				"</div>" +
				"<h2>" +
				escapeHtml(title) +
				"</h2>" +
				"<p>" +
				escapeHtml(description) +
				"</p>" +
				renderButtonLike(
					ctaLabel,
					ctaHref,
					ctaOpenInNewTab,
					"ak-bento-grid__cta",
				) +
				"</article>"
			);
		})
		.join("");

	return (
		'<section class="ak-bento-grid" data-theme="' +
		escapeAttr(theme) +
		'" data-platform="' +
		escapeAttr(platform) +
		'">' +
		'<div class="ak-bento-grid__grid">' +
		cards +
		"</div>" +
		"</section>"
	);
}

function emitSection(node: PageIRNode, ctx: EmitContext): string {
	ctx.usedClassnames.add("ak-section");

	const badgeLabel = getFirstString(node.props, ["badgeLabel", "eyebrow"]);
	const headline = getFirstString(node.props, ["headline", "title"], "Section");
	const highlightedHeadline = getFirstString(node.props, [
		"highlightedHeadline",
		"highlightedTitle",
	]);
	const description = getFirstString(node.props, ["description", "subtitle"]);

	return (
		'<section class="ak-section">' +
		'<div class="ak-section__wrap">' +
		(badgeLabel
			? '<p class="ak-section__badge">' + escapeHtml(badgeLabel) + "</p>"
			: "") +
		'<h2 class="ak-section__headline">' +
		escapeHtml(headline) +
		(highlightedHeadline
			? ' <span class="ak-section__highlight">' +
				escapeHtml(highlightedHeadline) +
				"</span>"
			: "") +
		"</h2>" +
		'<p class="ak-section__description">' +
		escapeHtml(description) +
		"</p>" +
		"</div>" +
		"</section>"
	);
}

function emitStatistics(node: PageIRNode, ctx: EmitContext): string {
	ctx.usedClassnames.add("ak-statistics");

	const title = getFirstString(node.props, ["title", "headline"], "Statistics");
	const items = getRecordArrayProp(node.props, "items");
	const stats = items.length
		? items
		: [
				{ value: "24/7", label: "support" },
				{ value: "99.9%", label: "uptime" },
				{ value: "3x", label: "faster launches" },
			];

	return (
		'<section class="ak-statistics">' +
		'<div class="ak-statistics__wrap">' +
		'<h2 class="ak-statistics__title">' +
		escapeHtml(title) +
		"</h2>" +
		'<ul class="ak-statistics__items">' +
		stats
			.map((item) => {
				const record = isRecord(item) ? item : {};
				const value = getFirstString(record, ["value", "number"], "0");
				const label = getFirstString(record, ["label", "title"], "metric");

				return (
					'<li class="ak-statistics__item">' +
					'<span class="ak-statistics__value">' +
					escapeHtml(value) +
					'</span><span class="ak-statistics__label">' +
					escapeHtml(label) +
					"</span></li>"
				);
			})
			.join("") +
		"</ul>" +
		"</div>" +
		"</section>"
	);
}

function emitBlogList(node: PageIRNode, ctx: EmitContext): string {
	ctx.usedClassnames.add("ak-blog-list");

	const posts = getRecordArrayProp(node.props, "posts");
	const cards = posts
		.map((post) => {
			const title = getFirstString(post, ["title"], "Untitled post");
			const description = getFirstString(post, ["description"]);
			const href = normalizeUrl(getStringFromRecord(post, "href"));
			const openInNewTab = getBooleanProp(post, "openInNewTab");
			const image = renderImage(
				getStringFromRecord(post, "imageSrc"),
				getFirstString(post, ["imageAlt", "title"], "Blog image"),
				ctx,
				' class="ak-blog-list__image" loading="lazy" decoding="async"',
			);
			const publishedAt = getFirstString(post, ["publishedAt"]);
			const publishedLabel = getFirstString(post, [
				"publishedLabel",
				"publishedAt",
			]);
			const relativeLabel = getFirstString(post, ["relativeLabel"]);
			const publishedText = relativeLabel
				? publishedLabel + " (" + relativeLabel + ")"
				: publishedLabel;
			const content =
				image +
				'<div class="ak-blog-list__content">' +
				(publishedText
					? '<p class="ak-blog-list__meta"><time datetime="' +
						escapeAttr(publishedAt) +
						'">' +
						escapeHtml(publishedText) +
						"</time></p>"
					: "") +
				'<h3 class="ak-blog-list__title">' +
				escapeHtml(title) +
				"</h3>" +
				'<p class="ak-blog-list__description">' +
				escapeHtml(description) +
				"</p>" +
				"</div>";

			if (href) {
				return (
					'<a class="ak-blog-list__card"' +
					renderHrefAttributes(href, openInNewTab) +
					">" +
					content +
					"</a>"
				);
			}

			return '<article class="ak-blog-list__card">' + content + "</article>";
		})
		.join("");

	return (
		'<section class="ak-blog-list">' +
		'<div class="ak-blog-list__grid">' +
		cards +
		"</div>" +
		"</section>"
	);
}

function emitHelps(node: PageIRNode, ctx: EmitContext): string {
	ctx.usedClassnames.add("ak-helps");

	const message = getFirstString(node.props, ["message", "description"]);
	const buttonLabel = getFirstString(node.props, ["buttonLabel"], "Learn more");
	const buttonHref = normalizeUrl(getStringProp(node.props, "buttonHref"));
	const buttonOpenInNewTab = getBooleanProp(node.props, "buttonOpenInNewTab");
	const avatars = getRecordArrayProp(node.props, "avatars");
	const avatarsHtml = avatars.length
		? '<ul class="ak-helps__avatars">' +
			avatars
				.map((avatar) => {
					const name = getFirstString(avatar, ["name"], "Contributor");
					const initials = getFallbackInitials(
						name,
						getFirstString(avatar, ["initials"]),
					);
					const image = renderImage(
						getStringFromRecord(avatar, "imageUrl"),
						name,
						ctx,
						' class="ak-helps__avatar" loading="lazy" decoding="async"',
					);

					return (
						'<li title="' +
						escapeAttr(name) +
						'">' +
						(image ||
							'<span class="ak-helps__fallback">' +
								escapeHtml(initials) +
								"</span>") +
						"</li>"
					);
				})
				.join("") +
			"</ul>"
		: "";

	return (
		'<section class="ak-helps">' +
		'<div class="ak-helps__wrap">' +
		'<p class="ak-helps__message">' +
		escapeHtml(message) +
		"</p>" +
		avatarsHtml +
		renderButtonLike(
			buttonLabel,
			buttonHref,
			buttonOpenInNewTab,
			"ak-helps__button",
		) +
		"</div>" +
		"</section>"
	);
}

function emitLogoClouds(node: PageIRNode, ctx: EmitContext): string {
	ctx.usedClassnames.add("ak-logo-clouds");

	const title = getFirstString(
		node.props,
		["title", "headline"],
		"Brands love us",
	);
	const subtitle = getFirstString(node.props, ["subtitle", "description"]);
	const propItems = getRecordArrayProp(node.props, "items");
	const items: ReadonlyArray<{ label: string; src: string }> =
		propItems.length > 0
			? propItems
					.map((item) => ({
						label: getFirstString(item, ["label", "alt", "name"], "Logo"),
						src:
							normalizeUrl(
								getFirstString(item, ["src", "imageUrl", "imageSrc", "url"]),
								{ allowSafeDataImage: true },
							) ?? "",
					}))
					.filter((item) => item.src !== "")
			: LOGO_CLOUD_DEFAULT_ITEMS;

	return (
		'<section class="ak-logo-clouds">' +
		'<div class="ak-logo-clouds__wrap">' +
		'<h2 class="ak-logo-clouds__title">' +
		escapeHtml(title) +
		"</h2>" +
		'<p class="ak-logo-clouds__subtitle">' +
		escapeHtml(subtitle) +
		"</p>" +
		'<ul class="ak-logo-clouds__list" aria-label="Brand logos">' +
		items
			.map((item) => {
				const image = renderImage(
					item.src,
					item.label + " logo",
					ctx,
					' loading="lazy" decoding="async"',
				);

				return image
					? '<li class="ak-logo-clouds__item">' + image + "</li>"
					: "";
			})
			.join("") +
		"</ul>" +
		"</div>" +
		"</section>"
	);
}

function createAssetIdsByUrl(ir: PageIR): ReadonlyMap<string, string> {
	const assetIdsByUrl = new Map<string, string>();

	for (const asset of ir.assets) {
		const normalizedUrl = asset.url.trim();

		if (normalizedUrl && !assetIdsByUrl.has(normalizedUrl)) {
			assetIdsByUrl.set(normalizedUrl, asset.id);
		}
	}

	return assetIdsByUrl;
}

function getFallbackInitials(name: string, initials: string): string {
	if (initials.trim()) {
		return initials.trim().slice(0, 2).toUpperCase();
	}

	const derived = name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? "")
		.join("");

	return derived || "?";
}

function renderFeatureList(
	features: readonly PropRecord[],
	label: string,
): string {
	if (!features.length) {
		return "";
	}

	return (
		"<h4>" +
		escapeHtml(label) +
		"</h4>" +
		"<ul>" +
		features
			.map((feature) => {
				const value = getFirstString(feature, ["label"], "Feature");
				return "<li>" + escapeHtml(value) + "</li>";
			})
			.join("") +
		"</ul>"
	);
}

function renderButtonLike(
	label: string,
	href: string | undefined,
	openInNewTab: boolean,
	className: string,
): string {
	if (!label) {
		return "";
	}

	if (!href) {
		return (
			'<button class="' +
			escapeAttr(className) +
			'" type="button" disabled>' +
			escapeHtml(label) +
			"</button>"
		);
	}

	return (
		'<a class="' +
		escapeAttr(className) +
		'"' +
		renderHrefAttributes(href, openInNewTab) +
		">" +
		escapeHtml(label) +
		"</a>"
	);
}

function renderHrefAttributes(href: string, openInNewTab: boolean): string {
	return (
		' href="' +
		escapeAttr(href) +
		'"' +
		(openInNewTab ? ' target="_blank" rel="noreferrer noopener"' : "")
	);
}

export function renderImage(
	url: string,
	alt: string,
	ctx: EmitContext,
	extraAttributes: string,
): string {
	const safeUrl = normalizeUrl(url, { allowSafeDataImage: true });

	if (!safeUrl) {
		return "";
	}

	const assetId = ctx.assetIdsByUrl?.get(safeUrl);
	const missingAlt = !alt.trim();

	if (missingAlt) {
		ctx.warnings.push({
			level: "warn",
			code: "MISSING_ALT",
			message: "Image rendered without alt text.",
			...(ctx.currentNodeId ? { nodeId: ctx.currentNodeId } : {}),
		});
	}

	if (assetId) {
		ctx.emittedAssetIds?.add(assetId);
		return (
			'<img data-asset-src="' +
			escapeAttr(safeUrl) +
			'" data-asset-id="' +
			escapeAttr(assetId) +
			'" alt="' +
			escapeAttr(alt) +
			'"' +
			extraAttributes +
			">"
		);
	}

	return (
		'<img src="' +
		escapeAttr(safeUrl) +
		'" alt="' +
		escapeAttr(alt) +
		'"' +
		extraAttributes +
		">"
	);
}

interface NormalizeUrlOptions {
	readonly allowSafeDataImage?: boolean;
}

const BLOCKED_SCHEMES = [
	"javascript:",
	"vbscript:",
	"file:",
	"blob:",
	"filesystem:",
] as const;

export function normalizeUrl(
	input: string,
	options: NormalizeUrlOptions = {},
): string | undefined {
	const candidate = input.trim();

	if (!candidate) {
		return undefined;
	}

	const collapsed = stripUnsafeAscii(candidate).toLowerCase();

	for (const scheme of BLOCKED_SCHEMES) {
		if (collapsed.startsWith(scheme)) {
			return undefined;
		}
	}

	if (
		collapsed.startsWith("data:") &&
		(!options.allowSafeDataImage || !isSafeDataImageUrl(candidate))
	) {
		return undefined;
	}

	return candidate;
}

function isSafeDataImageUrl(input: string): boolean {
	return /^data:image\/(?:png|jpe?g|gif|webp|avif)(?:;[^,]*)?,/i.test(input);
}

function stripUnsafeAscii(input: string): string {
	let output = "";

	for (const character of input) {
		const codePoint = character.charCodeAt(0);

		if (codePoint <= 0x20 || codePoint === 0x7f) {
			continue;
		}

		output += character;
	}

	return output;
}

function getStringProp(props: PropRecord, key: string): string {
	return getStringValue(props[key]);
}

function getBooleanProp(props: PropRecord, key: string): boolean {
	return getBooleanValue(props[key]);
}

function getStringFromRecord(record: PropRecord, key: string): string {
	return getStringValue(record[key]);
}

function getFirstString(
	record: PropRecord,
	keys: readonly string[],
	fallback = "",
): string {
	for (const key of keys) {
		const value = getStringFromRecord(record, key);

		if (value.trim()) {
			return value;
		}
	}

	return fallback;
}

function getRecordProp(props: PropRecord, key: string): PropRecord {
	const value = props[key];
	return isRecord(value) ? value : {};
}

function getRecordArrayProp(props: PropRecord, key: string): PropRecord[] {
	const value = props[key];

	if (!Array.isArray(value)) {
		return [];
	}

	return value.filter(isRecord);
}

function getStringValue(value: unknown): string {
	if (typeof value === "string") {
		return value;
	}

	if (typeof value === "number" || typeof value === "boolean") {
		return String(value);
	}

	return "";
}

function getBooleanValue(value: unknown): boolean {
	if (typeof value === "boolean") {
		return value;
	}

	if (typeof value === "string") {
		return value === "true";
	}

	return false;
}

function isRecord(value: unknown): value is PropRecord {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
