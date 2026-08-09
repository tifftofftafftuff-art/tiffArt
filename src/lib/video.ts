/**
 * Turns a pasted video URL (YouTube, Instagram, TikTok, Twitch) into an
 * embed descriptor. Anything unrecognized falls back to a plain link card,
 * so a bad paste never breaks the page.
 *
 * Twitch is special: its player requires a `parent` query param matching
 * the embedding domain, which a static build can't know — so Twitch embeds
 * are upgraded client-side by a tiny script on the videos page.
 */
export type VideoEmbed =
  | { kind: 'iframe'; src: string; aspect: 'wide' | 'tall' | 'portrait' }
  | { kind: 'twitch'; params: string }
  | { kind: 'link' };

export function parseVideoUrl(raw: string): VideoEmbed {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { kind: 'link' };
  }
  const host = url.hostname.replace(/^www\./, '');

  const youtube = (id: string, portrait = false): VideoEmbed => ({
    kind: 'iframe',
    src: `https://www.youtube-nocookie.com/embed/${id}`,
    aspect: portrait ? 'portrait' : 'wide',
  });

  if (host === 'youtu.be') {
    const id = url.pathname.split('/').filter(Boolean)[0];
    if (id) return youtube(id);
  }
  if (host.endsWith('youtube.com')) {
    const v = url.searchParams.get('v');
    if (v) return youtube(v);
    const match = url.pathname.match(/\/(shorts|embed|live)\/([\w-]+)/);
    if (match?.[2]) return youtube(match[2], match[1] === 'shorts');
  }

  if (host.endsWith('instagram.com')) {
    const match = url.pathname.match(/\/(reel|p|tv)\/([\w-]+)/);
    if (match) {
      return {
        kind: 'iframe',
        src: `https://www.instagram.com/${match[1]}/${match[2]}/embed/`,
        aspect: match[1] === 'p' ? 'tall' : 'portrait',
      };
    }
  }

  if (host.endsWith('tiktok.com')) {
    const match = url.pathname.match(/\/video\/(\d+)/);
    if (match) {
      return {
        kind: 'iframe',
        src: `https://www.tiktok.com/embed/v2/${match[1]}`,
        aspect: 'portrait',
      };
    }
  }

  if (host === 'clips.twitch.tv') {
    const slug = url.pathname.split('/').filter(Boolean)[0];
    if (slug) return { kind: 'twitch', params: `clip=${slug}` };
  }
  if (host.endsWith('twitch.tv')) {
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts[0] === 'videos' && parts[1]) return { kind: 'twitch', params: `video=${parts[1]}` };
    if (parts[1] === 'clip' && parts[2]) return { kind: 'twitch', params: `clip=${parts[2]}` };
    if (parts.length === 1) return { kind: 'twitch', params: `channel=${parts[0]}` };
  }

  return { kind: 'link' };
}
