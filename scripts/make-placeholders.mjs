/**
 * Generates solid-color placeholder JPEGs for the seed content so the site
 * renders immediately. Real artwork images uploaded through Pages CMS land
 * in the same folder (src/assets/media/) and simply replace these.
 *
 * Run with: npm run placeholders
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const OUT_DIR = new URL('../src/assets/media/', import.meta.url).pathname;

const images = [
  { file: 'morning-tide.jpg', w: 1600, h: 2000, bg: '#31547d', label: 'Morning Tide' },
  { file: 'undertow.jpg', w: 1600, h: 2000, bg: '#3d6b6e', label: 'Undertow' },
  { file: 'meadow-study-i.jpg', w: 2000, h: 1500, bg: '#7d8a4f', label: 'Meadow Study I' },
  { file: 'meadow-study-ii.jpg', w: 2000, h: 1500, bg: '#9a8a55', label: 'Meadow Study II' },
  { file: 'red-interior.jpg', w: 1700, h: 2100, bg: '#8a4a3d', label: 'Red Interior' },
  { file: 'still-life-with-lemons.jpg', w: 1800, h: 1400, bg: '#b0975a', label: 'Still Life with Lemons' },
  { file: 'portrait.jpg', w: 1200, h: 1500, bg: '#6b6560', label: 'Portrait' },
];

await mkdir(OUT_DIR, { recursive: true });

for (const { file, w, h, bg, label } of images) {
  const fontSize = Math.round(w / 22);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <rect width="100%" height="100%" fill="${bg}"/>
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
      font-family="Georgia, serif" font-size="${fontSize}" fill="rgba(255,255,255,0.85)">${label}</text>
    <text x="50%" y="58%" text-anchor="middle" dominant-baseline="middle"
      font-family="Georgia, serif" font-size="${Math.round(fontSize * 0.55)}" fill="rgba(255,255,255,0.55)">placeholder — ${w} × ${h}</text>
  </svg>`;

  await sharp(Buffer.from(svg)).jpeg({ quality: 80 }).toFile(path.join(OUT_DIR, file));
  console.log(`wrote ${file} (${w}×${h})`);
}
