import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Artworks — one markdown file per piece in src/content/artworks/.
 * The filename becomes the URL slug (/work/<filename>).
 * Images are referenced relative to the content file and flow through
 * Astro's image pipeline (sharp → AVIF/WebP, responsive sizes).
 */
const artworks = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/artworks' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      image: image(),
      year: z.number().optional(),
      medium: z.string().optional(),
      dimensions: z.string().optional(),
      series: z.string().optional(),
      featured: z.boolean().default(false),
      sortOrder: z.number().default(0),
      available: z.boolean().optional(),
    }),
});

/**
 * Site singleton — a single markdown file (src/content/site/index.md).
 * Frontmatter holds the structured fields; the markdown body is the
 * artist bio / statement, rendered on the About page.
 */
const site = defineCollection({
  loader: glob({ pattern: 'index.md', base: './src/content/site' }),
  schema: ({ image }) =>
    z.object({
      siteTitle: z.string(),
      artistName: z.string(),
      tagline: z.string().optional(),
      portrait: image().optional(),
      portraitCaption: z.string().optional(),
      email: z.string().optional(),
      aboutHeading: z.string().optional(),
      contactHeading: z.string().optional(),
      contactIntro: z.string().optional(),
      footerNote: z.string().optional(),
      socialLinks: z
        .array(z.object({ label: z.string(), url: z.string().url() }))
        .default([]),
    }),
});

export const collections = { artworks, site };
