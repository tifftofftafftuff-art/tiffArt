# Artist Portfolio

Static portfolio site built with [Astro](https://astro.build), deployed to
Cloudflare Workers (static assets) via Workers Builds, with content managed
through [Pages CMS](https://pagescms.org).

Styling is deliberately minimal — a design pass happens later. See
[`DESIGN-HANDOFF.md`](./DESIGN-HANDOFF.md).

## Local development

Requires Node 22 (`.nvmrc` is pinned; `nvm use` picks it up).

```sh
npm install
npm run dev        # http://localhost:4321
npm run build      # static build into dist/
npm run preview    # serve the built dist/ locally
```

Optional env vars for local dev — copy `.env.example` to `.env`:

| Variable | Purpose |
| --- | --- |
| `PUBLIC_WEB3FORMS_KEY` | Web3Forms access key for the contact form. Without it the contact page shows a fallback message instead of the form. |
| `SITE_URL` | Canonical site URL. Enables sitemap, canonical/`og:url` tags, and the `Sitemap:` line in robots.txt. Leave unset locally. |

## Content editing

All content lives in files — no code changes needed to edit it:

- **Artworks**: one markdown file per piece in `src/content/artworks/`.
  Frontmatter fields: `title`, `image`, `year`, `medium`, `dimensions`,
  `series`, `featured`, `sortOrder`, `available`; the body is an optional
  longer description. The filename is the URL slug (`/work/<filename>/`).
- **Site settings**: `src/content/site/index.md` — site title, artist name,
  tagline, portrait, contact email, social links; the body is the bio /
  artist statement shown on the About page.
- **Images**: `src/assets/media/`. Referenced from content files with
  relative paths (`../../assets/media/foo.jpg`) so they flow through Astro's
  image pipeline (AVIF/WebP, responsive sizes).

The artist edits all of this in a friendly UI at
[app.pagescms.org](https://app.pagescms.org) (config: `.pages.yml` in the
repo root). Pages CMS commits straight to this repo; every commit to `main`
triggers a deploy.

Seed placeholder images can be regenerated with `npm run placeholders`.

## Deploy pipeline

- Cloudflare **Workers Builds** watches this GitHub repo. On every push to
  `main` it runs `npm run build` and then `npx wrangler deploy`, which
  uploads `dist/` as a static-assets Worker (config in `wrangler.jsonc` —
  no server code, 404 handling and trailing slashes configured there).
- Build variables to set in the Cloudflare dashboard (Workers & Pages →
  tiffart → Settings → Build → Variables and secrets):
  - `PUBLIC_WEB3FORMS_KEY` — required for the contact form.
  - `SITE_URL` — the deployed URL (e.g. `https://tiffart.<subdomain>.workers.dev`,
    later the custom domain). Enables sitemap + OpenGraph URLs.
- Node version comes from `.nvmrc` (22) automatically.

`npm run deploy` builds and deploys from a local machine (needs
`wrangler login`), but the normal path is git push → auto build.

## Admin editing (tufftiff-art.com/admin)

The site has an on-domain editor at `/admin` (Sveltia CMS). Signing in uses
GitHub under the hood, but access is controlled by this site's own Worker:
only GitHub accounts whose **verified email** appears in the
`ADMIN_ALLOWED_EMAILS` list (in `wrangler.jsonc`) are let in. Every save
commits to `main`, which redeploys the site automatically.

One-time setup:

1. Create a GitHub **OAuth App** (as the repo owner account):
   github.com → Settings → Developer settings → OAuth Apps → New OAuth App
   - Homepage URL: `https://tufftiff-art.com`
   - Authorization callback URL: `https://tufftiff-art.com/api/auth/callback`
2. Copy the Client ID, generate a Client Secret.
3. In the Cloudflare dashboard → Workers & Pages → tiffart → Settings →
   Variables and Secrets, add both as **secrets**:
   `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`.
4. Redeploy (any push, or Retry build).

To allow another editor later: add their email to `ADMIN_ALLOWED_EMAILS`
in `wrangler.jsonc` — they also need write access to this repo on GitHub.

(Pages CMS via `.pages.yml` still works as an alternative editor at
app.pagescms.org.)

## Twitch smart embed

The videos page upgrades a Twitch *channel* card to show the **latest VOD**
whenever the channel is offline (live streams still take priority). This
uses `/api/twitch/latest` on the Worker, which needs a Twitch dev app:

1. dev.twitch.tv/console → Register Your Application (category: Website
   Integration; OAuth redirect can be `https://localhost` — it's unused).
2. Copy the Client ID and generate a Client Secret.
3. Add both as **secrets** on the Worker (same place as the GitHub ones):
   `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`.

Until the secrets exist, the endpoint reports unconfigured and the page
shows the plain channel embed (offline card when not live). Note VODs only
exist if "Store past broadcasts" is enabled in Twitch stream settings.

## Contact form

Plain HTML form posting to Web3Forms — works without JavaScript. A tiny
inline script adds a redirect back to `/thanks/` on this site; with JS
disabled, Web3Forms shows its own hosted success page. A hidden honeypot
field (`botcheck`) filters naive spam bots.
