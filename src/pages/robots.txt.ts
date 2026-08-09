import type { APIRoute } from 'astro';

// Emits the Sitemap line only when the site URL is known (Cloudflare Pages
// provides CF_PAGES_URL at build time), so robots.txt is valid both locally
// and before a custom domain exists.
export const GET: APIRoute = ({ site }) => {
  const lines = ['User-agent: *', 'Allow: /', 'Disallow: /admin/', 'Disallow: /api/'];
  if (site) {
    lines.push('', `Sitemap: ${new URL('sitemap-index.xml', site).href}`);
  }
  return new Response(lines.join('\n') + '\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
