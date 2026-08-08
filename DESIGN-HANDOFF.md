# Design Handoff Notes

> **Status (2026-08-08):** the design pass has been applied — the "Tiffany
> Sung Site" comp from Claude Design now lives in `global.css` (tokens +
> layout), with Google Fonts (Permanent Marker, Gaegu) loaded in
> `BaseLayout.astro`. The notes below still describe how the theming is
> structured and remain the guide for any future redesign.

This scaffold was intentionally unstyled beyond a readable baseline. The
design pass should be a **CSS swap, not a rebuild** — markup, class names,
and content structure are stable.

## Where the tokens live

Everything themeable is a CSS custom property at the top of
[`src/styles/global.css`](./src/styles/global.css) under `:root`:

- **Colors**: `--color-bg`, `--color-text`, `--color-text-muted`,
  `--color-accent`, `--color-border`, `--color-surface`
- **Typography**: `--font-display` (headings/site title), `--font-body`,
  `--text-sm|base|lg|xl|2xl`, `--leading-body`, `--leading-heading`
- **Spacing**: `--space-2xs` … `--space-2xl`
- **Layout**: `--content-max-width`, `--prose-max-width`,
  `--gallery-min-column`

No color, font, or spacing value is used anywhere outside this file.

## Components & templates

| File | Renders |
| --- | --- |
| `src/layouts/BaseLayout.astro` | `<head>` (SEO/OG), header + nav, footer. Wraps every page. |
| `src/components/ArtworkCard.astro` | One gallery tile (image, title, year · medium). |
| `src/components/ContactForm.astro` | Web3Forms contact form + no-key fallback. |
| `src/pages/index.astro` | Gallery: featured-first, sorted, grouped by series. |
| `src/pages/work/[slug].astro` | Single artwork: large image + details column. |
| `src/pages/about.astro` | Portrait + bio (markdown body of the site singleton). |
| `src/pages/contact.astro` | Intro copy, form, social links. |
| `src/pages/thanks.astro`, `src/pages/404.astro` | Utility pages. |

Stable class-name hooks (all styled in `global.css`, none styled inline):
`site-header`, `site-title`, `site-nav`, `site-main`, `site-footer`,
`gallery-section`, `gallery-section-title`, `gallery-grid`, `artwork-card`,
`artwork-card-image`, `artwork-card-title`, `artwork-card-meta`,
`artwork-page`, `artwork-figure`, `artwork-details`, `artwork-meta`,
`artwork-description`, `about-page`, `about-portrait`, `prose`,
`contact-form`, `form-field`, `form-note`, `social-links`, `back-link`,
`skip-link`, `visually-hidden`, `honeypot-field`.

## What the design pass is expected to touch

- **Replace token values** (palette, real typefaces, spacing rhythm) and
  the layout rules below the tokens in `global.css` — grid treatments,
  hover states, transitions, dark mode if desired.
- **Web fonts**: add `@font-face`/preloads in `BaseLayout.astro`'s head and
  point `--font-display` / `--font-body` at them.
- **Favicon / OG imagery**: `public/favicon.svg` is a placeholder.
- **Placeholder content**: seed artworks and bio are obviously fake; real
  content arrives via Pages CMS, not the design pass.

## What it should not need to touch

- Markup structure, content collections, `.pages.yml`, the contact form
  wiring, image pipeline settings, or anything under `src/pages/` beyond
  adding classes/wrappers if truly necessary. If a layout change requires
  new markup, keep the existing class names working.

One deliberate exception: the `sizes`/`widths` attributes on `<Picture>`
components in `ArtworkCard.astro`, `work/[slug].astro`, and `about.astro`
assume the current column widths. If the design changes how wide images
render, update those to match.
