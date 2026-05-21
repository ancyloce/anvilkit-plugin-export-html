import type { HtmlExportOptions } from "../types/types.js";

const BASE_CSS = [
	":root{color-scheme:light;font-family:Inter,ui-sans-serif,system-ui,sans-serif;line-height:1.5;}",
	"*{box-sizing:border-box;}",
	"body{margin:0;background:#f5f1e8;color:#111827;}",
	"a{color:inherit;text-decoration:none;}",
	"img{display:block;max-width:100%;}",
].join("");

const CSS_MANIFEST: Record<string, string> = {
	"ak-bento-grid":
		".ak-bento-grid{padding:2rem 1.5rem;background:#111827;color:#f9fafb}.ak-bento-grid__grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(16rem,1fr));gap:1rem;max-width:72rem;margin:0 auto}.ak-bento-grid__card{padding:1.5rem;border-radius:1.25rem;background:rgba(255,255,255,.08)}.ak-bento-grid__icon{width:2.5rem;height:2.5rem;display:grid;place-items:center;border-radius:999px;background:#f59e0b;color:#111827;font-weight:700}.ak-bento-grid__cta{display:inline-flex;margin-top:1rem;color:#fbbf24;font-weight:600}",
	"ak-blog-list":
		".ak-blog-list{padding:2rem 1.5rem}.ak-blog-list__grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(18rem,1fr));gap:1rem;max-width:72rem;margin:0 auto}.ak-blog-list__card{display:block;overflow:hidden;border:1px solid #d6d3d1;border-radius:1.25rem;background:#fff}.ak-blog-list__content{padding:1rem 1.1rem 1.25rem}.ak-blog-list__meta{color:#6b7280;font-size:.9rem}.ak-blog-list__title{margin:.4rem 0 0;font-size:1.3rem}.ak-blog-list__description{margin:.65rem 0 0;color:#4b5563}",
	"ak-helps":
		".ak-helps{padding:3rem 1.5rem;background:radial-gradient(circle at top,#ecfccb,#ffffff 55%)}.ak-helps__wrap{max-width:56rem;margin:0 auto;text-align:center}.ak-helps__message{margin:0 auto;max-width:42rem;font-size:1.1rem;white-space:pre-line}.ak-helps__avatars{display:flex;justify-content:center;gap:.75rem;flex-wrap:wrap;list-style:none;padding:0;margin:1.5rem 0}.ak-helps__avatar,.ak-helps__fallback{width:3rem;height:3rem;border-radius:999px;border:2px solid #fff;box-shadow:0 6px 18px rgba(0,0,0,.12)}.ak-helps__fallback{display:grid;place-items:center;background:#111827;color:#fff;font-weight:700}.ak-helps__button{display:inline-flex;padding:.8rem 1.2rem;border-radius:999px;background:#111827;color:#fff;font-weight:600}",
	"ak-hero":
		".ak-hero{padding:5rem 1.5rem;background:linear-gradient(180deg,#fff7ed,#f8fafc)}.ak-hero__wrap{max-width:70rem;margin:0 auto;text-align:center}.ak-hero__eyebrow,.ak-hero__button{display:inline-flex;padding:.7rem 1.1rem;border-radius:999px;border:1px solid #d6d3d1;background:#fff;font-weight:600}.ak-hero__headline{margin:1.5rem 0 0;font-size:clamp(2.5rem,7vw,5.5rem);line-height:.95;white-space:pre-line}.ak-hero__description{margin:1rem auto 0;max-width:46rem;font-size:1.15rem;color:#4b5563;white-space:pre-line}.ak-hero__actions{display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;margin-top:2rem}.ak-hero__button--primary{background:#111827;color:#fff;border-color:#111827}",
	"ak-logo-clouds":
		".ak-logo-clouds{padding:4rem 1.5rem;text-align:center;background:#fff}.ak-logo-clouds__wrap{max-width:72rem;margin:0 auto}.ak-logo-clouds__title{margin:0;font-size:clamp(2.2rem,6vw,4.2rem)}.ak-logo-clouds__subtitle{margin:1rem auto 0;max-width:40rem;color:#6b7280}.ak-logo-clouds__list{display:grid;grid-template-columns:repeat(auto-fit,minmax(8rem,1fr));gap:1rem;list-style:none;padding:0;margin:2rem 0 0}.ak-logo-clouds__item{display:grid;place-items:center;min-height:5rem;padding:1rem;border:1px solid #e5e7eb;border-radius:1rem;background:#fafaf9}",
	"ak-navbar":
		".ak-navbar{padding:1rem 1.5rem;background:#fff;border-bottom:1px solid #e5e7eb}.ak-navbar__wrap{max-width:72rem;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap}.ak-navbar__brand{font-weight:700;font-size:1.05rem}.ak-navbar__menu,.ak-navbar__actions{display:flex;gap:1rem;align-items:center;list-style:none;padding:0;margin:0}.ak-navbar__menu a[aria-current='page']{text-decoration:underline;text-underline-offset:.3em}.ak-navbar__action{display:inline-flex;padding:.65rem 1rem;border-radius:999px;border:1px solid #d1d5db;background:#fff}.ak-navbar__action[data-variant='default']{background:#111827;border-color:#111827;color:#fff}",
	"ak-pricing-minimal":
		".ak-pricing-minimal{padding:4rem 1.5rem;background:#fff}.ak-pricing-minimal__wrap{max-width:72rem;margin:0 auto}.ak-pricing-minimal__header{text-align:center;max-width:42rem;margin:0 auto}.ak-pricing-minimal__grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(16rem,1fr));gap:1rem;margin-top:2rem}.ak-pricing-minimal__card{padding:1.4rem;border:1px solid #e5e7eb;border-radius:1.4rem;background:#fafaf9}.ak-pricing-minimal__card[data-featured='true']{background:#111827;color:#fff;border-color:#111827}.ak-pricing-minimal__price{font-size:2.5rem;font-weight:700;margin-top:1rem}.ak-pricing-minimal__button{display:inline-flex;margin-top:1rem;padding:.75rem 1rem;border-radius:999px;background:#111827;color:#fff}.ak-pricing-minimal__card[data-featured='true'] .ak-pricing-minimal__button{background:#fff;color:#111827}",
	"ak-section":
		".ak-section{padding:4rem 1.5rem;background:#f8fafc}.ak-section__wrap{max-width:52rem;margin:0 auto;text-align:center}.ak-section__badge{display:inline-flex;padding:.35rem .8rem;border-radius:999px;background:#111827;color:#fff;font-size:.85rem}.ak-section__headline{margin:1rem 0 0;font-size:clamp(2rem,5vw,4rem);line-height:1}.ak-section__highlight{color:#2563eb}.ak-section__description{margin:1rem auto 0;max-width:36rem;color:#4b5563;white-space:pre-line}",
	"ak-statistics":
		".ak-statistics{padding:3rem 1.5rem;background:#111827;color:#f9fafb;text-align:center}.ak-statistics__wrap{max-width:60rem;margin:0 auto}.ak-statistics__title{margin:0;font-size:.95rem;letter-spacing:.28em;text-transform:uppercase;color:#cbd5e1}.ak-statistics__items{display:grid;grid-template-columns:repeat(auto-fit,minmax(10rem,1fr));gap:1rem;list-style:none;padding:0;margin:2rem 0 0}.ak-statistics__item{padding:1.25rem;border-radius:1rem;background:rgba(255,255,255,.08)}.ak-statistics__value{display:block;font-size:2rem;font-weight:700}.ak-statistics__label{display:block;margin-top:.35rem;color:#cbd5e1}",
	"ak-unknown":
		".ak-unknown{min-height:4rem;margin:1rem 1.5rem;border:2px dashed #f59e0b;border-radius:1rem;background:#fffbeb}",
};

export function emitCss(
	usedClassnames: ReadonlySet<string>,
	opts: HtmlExportOptions,
): string {
	if (opts.inlineStyles === false) {
		throw new Error(
			"@anvilkit/plugin-export-html: inlineStyles:false is not supported in this alpha. " +
				"The export format currently returns a single document; sidecar CSS files require an " +
				"ExportResult shape that is not yet defined. Track progress in phase4 (sidecar assets).",
		);
	}

	const rules = Array.from(usedClassnames)
		.sort()
		.map((classname) => CSS_MANIFEST[classname] ?? "")
		.filter(Boolean)
		.join("");

	return "<style>" + BASE_CSS + rules + "</style>";
}
