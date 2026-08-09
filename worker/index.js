/**
 * Worker entry: serves the static site (ASSETS binding) and implements the
 * GitHub OAuth flow used by the /admin CMS (Sveltia, Decap-compatible).
 *
 * Access is restricted server-side: after GitHub sign-in, the user's
 * verified emails are checked against ADMIN_ALLOWED_EMAILS (comma-separated,
 * set in wrangler.jsonc vars). Anyone else never receives a token from us —
 * and GitHub itself still requires repo write access for any commit.
 *
 * Required secrets (set in the Cloudflare dashboard → Worker → Settings →
 * Variables and Secrets):
 *   GITHUB_CLIENT_ID     — OAuth app client ID
 *   GITHUB_CLIENT_SECRET — OAuth app client secret
 */

const OAUTH_SCOPE = 'public_repo user:email';
const STATE_COOKIE = 'admin_oauth_state';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/auth') return startAuth(url, env);
    if (url.pathname === '/api/auth/callback') return finishAuth(request, url, env);
    if (url.pathname.startsWith('/api/')) return new Response('Not found', { status: 404 });
    return env.ASSETS.fetch(request);
  },
};

function startAuth(url, env) {
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return htmlResponse(
      page(
        'Admin not configured',
        'The <code>GITHUB_CLIENT_ID</code> / <code>GITHUB_CLIENT_SECRET</code> secrets are not set on this Worker yet. See README → “Admin editing”.',
      ),
      500,
    );
  }
  const state = crypto.randomUUID();
  const authorize = new URL('https://github.com/login/oauth/authorize');
  authorize.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
  authorize.searchParams.set('redirect_uri', `${url.origin}/api/auth/callback`);
  authorize.searchParams.set('scope', OAUTH_SCOPE);
  authorize.searchParams.set('state', state);
  return new Response(null, {
    status: 302,
    headers: {
      Location: authorize.toString(),
      'Set-Cookie': `${STATE_COOKIE}=${state}; Max-Age=600; Path=/api/auth; Secure; HttpOnly; SameSite=Lax`,
    },
  });
}

async function finishAuth(request, url, env) {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookieState = (request.headers.get('Cookie') || '')
    .split(/;\s*/)
    .find((c) => c.startsWith(`${STATE_COOKIE}=`))
    ?.split('=')[1];

  if (!code || !state || state !== cookieState) {
    return htmlResponse(page('Sign-in failed', 'Invalid or expired sign-in attempt. Close this window and try again.'), 400);
  }

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${url.origin}/api/auth/callback`,
    }),
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    return htmlResponse(page('Sign-in failed', 'GitHub did not issue a token. Close this window and try again.'), 502);
  }
  const token = tokenData.access_token;

  const emailsRes = await fetch('https://api.github.com/user/emails', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'tiffart-admin',
    },
  });
  const emails = emailsRes.ok ? await emailsRes.json() : [];
  const allowed = (env.ADMIN_ALLOWED_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const isAllowed =
    Array.isArray(emails) &&
    emails.some((e) => e.verified && allowed.includes(String(e.email).toLowerCase()));

  if (!isAllowed) {
    return htmlResponse(
      page(
        'Not authorized',
        'This GitHub account is not on the editor list for this site. If it should be, the site owner can add its email address to <code>ADMIN_ALLOWED_EMAILS</code>.',
      ),
      403,
    );
  }

  // Decap/Sveltia OAuth handshake: tell the opener we're here, then hand
  // the token over on its reply.
  const payload = JSON.stringify({ token, provider: 'github' });
  const script = `
    (function () {
      function receiveMessage() {
        window.opener.postMessage('authorization:github:success:' + ${JSON.stringify(payload)}, '*');
        window.removeEventListener('message', receiveMessage, false);
      }
      window.addEventListener('message', receiveMessage, false);
      window.opener.postMessage('authorizing:github', '*');
    })();
  `;
  return htmlResponse(
    `<!doctype html><html><body><p>Signing you in…</p><script>${script}</script></body></html>`,
    200,
    // Expire the state cookie.
    { 'Set-Cookie': `${STATE_COOKIE}=; Max-Age=0; Path=/api/auth; Secure; HttpOnly; SameSite=Lax` },
  );
}

function page(title, body) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title></head>
<body style="font-family:system-ui;max-width:32rem;margin:4rem auto;padding:0 1rem">
<h1 style="font-size:1.3rem">${title}</h1><p>${body}</p></body></html>`;
}

function htmlResponse(html, status = 200, extraHeaders = {}) {
  return new Response(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', ...extraHeaders },
  });
}
