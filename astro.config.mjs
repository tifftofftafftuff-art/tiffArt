// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// The canonical site URL is not hardcoded anywhere:
// - Set SITE_URL as a build variable in the Cloudflare dashboard once the
//   *.workers.dev (or custom-domain) URL is known — Workers Builds does not
//   expose the deployment URL automatically.
// - CF_PAGES_URL is picked up as a fallback if this ever runs on classic
//   Cloudflare Pages, where that variable is provided automatically.
// - Locally neither is set; `site` stays undefined and everything that
//   needs an absolute URL (sitemap, og:url, robots.txt Sitemap line) is
//   skipped gracefully.
const site = process.env.SITE_URL || process.env.CF_PAGES_URL || undefined;

export default defineConfig({
  output: 'static',
  site,
  // The sitemap integration warns and skips when `site` is undefined,
  // so only enable it when we actually have a URL.
  integrations: site ? [sitemap()] : [],
});
