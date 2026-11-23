import { randomBytes } from 'node:crypto';
import {
  createInitialPanelOwner,
  discordPanelAccount,
  createSession,
  deleteSession,
  getPanelUserById,
  getPanelUserByUsername,
  getPanelUsers,
  getSessionUser,
  hasPassword,
  purgeExpiredSessions,
  type PanelUserWithGroup,
} from './db';
import { hashPassword, verifyPassword } from './password';
import { json, readJson } from './util';

const COOKIE = 'admin_session';
const SESSION_MS = 7 * 24 * 60 * 60 * 1000;

// Behind Nginx or Ngrok the browser talks HTTPS while this server sees HTTP, so trust X-Forwarded-Proto for the flag.
// (A client that fakes it only loses its own login: the browser will not send a Secure cookie back over HTTP.)
const isSecure = (req: Request): boolean =>
  new URL(req.url).protocol === 'https:' || req.headers.get('x-forwarded-proto')?.split(',')[0].trim() === 'https';

const sessionCookie = (token: string, maxAge: number, secure: boolean): string =>
  `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;

// The session normally lives in an HttpOnly cookie. Browsers that refuse cookies can sign in with X-Panel-Token: 1 and
// keep the token in memory, sending it back as a Bearer header (it is gone on reload, which is what such users expect).
const bearer = (req: Request): string | undefined => {
  const h = req.headers.get('authorization') ?? '';
  return h.toLowerCase().startsWith('bearer ') ? h.slice(7).trim() || undefined : undefined;
};
const sessionToken = (req: Request): string | undefined =>
  new Bun.CookieMap(req.headers.get('cookie') ?? '').get(COOKIE) ?? bearer(req);

export async function authUser(req: Request): Promise<PanelUserWithGroup | null> {
  const token = sessionToken(req);
  if (!token) return null;
  await purgeExpiredSessions();
  return getSessionUser(token);
}

export function hasPermission(user: PanelUserWithGroup | null, perm: string): boolean {
  if (!user) return false;
  return user.role === 'owner' || user.permissions.includes('*') || user.permissions.includes(perm);
}

async function startSession(req: Request, userId: number): Promise<Response> {
  const token = randomBytes(32).toString('hex');
  await createSession(token, userId, Date.now() + SESSION_MS);
  const user = await getPanelUserById(userId);
  if (req.headers.get('x-panel-token') === '1') return json({ ok: true, user, token }); // no cookie: the client holds it in memory
  return json({ ok: true, user }, 200, { 'Set-Cookie': sessionCookie(token, SESSION_MS / 1000, isSecure(req)) });
}

export async function handleAuth(req: Request, path: string): Promise<Response> {
  const post = req.method === 'POST';

  if (req.method === 'GET' && path === '/api/auth/status')
    return json({ needsSetup: !(await hasPassword()), discordEnabled: discordConfig() !== null });
  if (req.method === 'GET' && path.startsWith('/api/auth/discord/')) return discordAuth(req, path);

  if (req.method === 'GET' && path === '/api/auth/session') {
    const user = await authUser(req);
    return json({ authenticated: !!user, user });
  }

  if (post && path === '/api/auth/setup') {
    if (await hasPassword()) return json({ ok: false, error: 'Admin panel is already configured.' }, 403);
    const body = await readJson(req);
    const password = String(body.password || '');
    if (password.length < 4) return json({ ok: false, error: 'Password must be at least 4 characters.' }, 400);
    const userId = await createInitialPanelOwner({
      username: String(body.username || 'admin').trim() || 'admin',
      passwordHash: hashPassword(password),
      displayName: String(body.displayName || 'Panel Owner').trim() || 'Panel Owner',
    });
    if (userId === null) return json({ ok: false, error: 'Admin panel is already configured.' }, 403);
    return startSession(req, userId);
  }

  if (post && path === '/api/auth/login') {
    const body = await readJson(req);
    const password = String(body.password || '');
    const username = String(body.username || '').trim();
    if (!password) return json({ ok: false, error: 'Password is required.' }, 400);

    let target = await getPanelUserByUsername(username || 'admin');
    if (!target && !username) {
      const first = (await getPanelUsers())[0];
      if (first) target = await getPanelUserByUsername(first.username);
    }
    if (!target || !verifyPassword(password, target.password_hash)) {
      return json({ ok: false, error: 'Invalid username or password.' }, 401);
    }
    return startSession(req, target.id);
  }

  if (post && path === '/api/auth/logout') {
    const token = sessionToken(req);
    if (token) await deleteSession(token);
    return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie('', 0, isSecure(req)) });
  }

  return json({ error: 'Not found' }, 404);
}

const oauthStates = new Map<string, number>();
const OAUTH_COOKIE = 'panel_discord_state';
function discordConfig() {
  const clientId = process.env.PANEL_DISCORD_CLIENT_ID;
  const secret = process.env.PANEL_DISCORD_CLIENT_SECRET;
  const ownerId = process.env.PANEL_DISCORD_OWNER_ID;
  const redirect = process.env.PANEL_DISCORD_REDIRECT_URI;
  if (!clientId || !/^\d{15,25}$/.test(clientId) || !secret || !ownerId || !/^\d{15,25}$/.test(ownerId) || !redirect)
    return null;
  try {
    const url = new URL(redirect);
    if (
      (url.protocol !== 'https:' &&
        !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))) ||
      url.username ||
      url.password ||
      url.pathname !== '/api/auth/discord/callback' ||
      url.search ||
      url.hash
    )
      return null;
    return { clientId, secret, ownerId, redirect: url.href, secure: url.protocol === 'https:' };
  } catch {
    return null;
  }
}
async function discordAuth(req: Request, path: string): Promise<Response> {
  const config = discordConfig();
  if (!config) return json({ error: 'Discord sign-in is not configured.' }, 404);
  const cookie = (value: string, maxAge: number) =>
    `${OAUTH_COOKIE}=${value}; Path=/api/auth/discord; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${config.secure ? '; Secure' : ''}`;
  if (path === '/api/auth/discord/start') {
    for (const [state, expires] of oauthStates) if (expires <= Date.now()) oauthStates.delete(state);
    if (oauthStates.size >= 200) return json({ error: 'Sign-in is busy. Try again shortly.' }, 429);
    const state = randomBytes(32).toString('hex');
    oauthStates.set(state, Date.now() + 300000);
    const url = new URL('https://discord.com/oauth2/authorize');
    url.search = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirect,
      response_type: 'code',
      scope: 'identify',
      state,
      prompt: 'consent',
    }).toString();
    return new Response(null, {
      status: 302,
      headers: { Location: url.href, 'Set-Cookie': cookie(state, 300), 'Cache-Control': 'no-store' },
    });
  }
  if (path !== '/api/auth/discord/callback') return json({ error: 'Not found' }, 404);
  const url = new URL(req.url),
    state = url.searchParams.get('state') ?? '';
  const bound = new Bun.CookieMap(req.headers.get('cookie') ?? '').get(OAUTH_COOKIE);
  const expires = oauthStates.get(state) ?? 0;
  const fail = () =>
    new Response(null, {
      status: 303,
      headers: { Location: '/?discord_error=1', 'Set-Cookie': cookie('', 0), 'Cache-Control': 'no-store' },
    });
  if (!bound || bound !== state || expires <= Date.now()) return fail();
  oauthStates.delete(state);
  const code = url.searchParams.get('code');
  if (
    !code ||
    code.length > 2048 ||
    url.searchParams.has('error') ||
    (url.searchParams.has('iss') && url.searchParams.get('iss') !== 'https://discord.com')
  )
    return fail();
  let accessToken = '';
  try {
    const response = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      redirect: 'error',
      signal: AbortSignal.timeout(10000),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.secret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: config.redirect,
      }),
    });
    if (!response.ok) return fail();
    const token = (await response.json()) as { access_token?: string; token_type?: string };
    if (typeof token.access_token !== 'string' || token.token_type?.toLowerCase() !== 'bearer') return fail();
    accessToken = token.access_token;
    const identity = await fetch('https://discord.com/api/v10/users/@me', {
      headers: { Authorization: 'Bearer ' + accessToken },
      redirect: 'error',
      signal: AbortSignal.timeout(10000),
    });
    if (!identity.ok) return fail();
    const user = (await identity.json()) as { id?: string; username?: string; global_name?: string; bot?: boolean };
    if (typeof user.id !== 'string' || !/^\d{15,25}$/.test(user.id) || user.bot) return fail();
    const allowed = (process.env.PANEL_DISCORD_ALLOWED_IDS ?? '')
      .split(',')
      .map((x) => x.trim())
      .filter((x) => /^\d{15,25}$/.test(x));
    if (user.id !== config.ownerId && !allowed.includes(user.id)) return fail();
    const id = await discordPanelAccount(
      user.id,
      String(user.global_name || user.username || 'Discord user').slice(0, 100),
      config.ownerId,
      allowed,
      hashPassword(randomBytes(48).toString('hex')),
    );
    if (id === null) return fail();
    const session = await startSession(
      new Request(req.url, { headers: { 'x-forwarded-proto': config.secure ? 'https' : 'http' } }),
      id,
    );
    const headers = new Headers({ Location: '/', 'Cache-Control': 'no-store' });
    headers.append('Set-Cookie', session.headers.get('Set-Cookie')!);
    headers.append('Set-Cookie', cookie('', 0));
    return new Response(null, { status: 303, headers });
  } catch {
    return fail();
  } finally {
    if (accessToken)
      void fetch('https://discord.com/api/oauth2/token/revoke', {
        method: 'POST',
        redirect: 'error',
        signal: AbortSignal.timeout(5000),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.secret,
          token: accessToken,
          token_type_hint: 'access_token',
        }),
      }).catch(() => {});
  }
}
