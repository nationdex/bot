import { randomBytes } from 'node:crypto';
import {
  createPanelUser, createSession, deleteSession, getGroups, getPanelUserById, getPanelUserByUsername,
  getPanelUsers, getSessionUser, hasPassword, purgeExpiredSessions, type PanelUserWithGroup,
} from './db';
import { hashPassword, verifyPassword } from './password';
import { json, readJson } from './util';

const COOKIE = 'admin_session';
const SESSION_MS = 7 * 24 * 60 * 60 * 1000;

const sessionCookie = (token: string, maxAge: number): string =>
  `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;

const sessionToken = (req: Request): string | undefined => new Bun.CookieMap(req.headers.get('cookie') ?? '').get(COOKIE) ?? undefined;

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

async function startSession(userId: number): Promise<Response> {
  const token = randomBytes(32).toString('hex');
  await createSession(token, userId, Date.now() + SESSION_MS);
  return json({ ok: true, user: await getPanelUserById(userId) }, 200, { 'Set-Cookie': sessionCookie(token, SESSION_MS / 1000) });
}

export async function handleAuth(req: Request, path: string): Promise<Response> {
  const post = req.method === 'POST';

  if (req.method === 'GET' && path === '/api/auth/status') return json({ needsSetup: !(await hasPassword()) });

  if (req.method === 'GET' && path === '/api/auth/session') {
    const user = await authUser(req);
    return json({ authenticated: !!user, user });
  }

  if (post && path === '/api/auth/setup') {
    if (await hasPassword()) return json({ ok: false, error: 'Admin panel is already configured.' }, 403);
    const body = await readJson(req);
    const password = String(body.password || '');
    if (password.length < 4) return json({ ok: false, error: 'Password must be at least 4 characters.' }, 400);
    const adminGroup = (await getGroups()).find((g) => g.name === 'Administrators');
    const userId = await createPanelUser({
      username: String(body.username || 'admin').trim() || 'admin',
      passwordHash: hashPassword(password),
      displayName: String(body.displayName || 'Panel Owner').trim() || 'Panel Owner',
      role: 'owner',
      groupId: adminGroup?.id ?? 1,
      permissions: ['*'],
    });
    return startSession(userId);
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
    return startSession(target.id);
  }

  if (post && path === '/api/auth/logout') {
    const token = sessionToken(req);
    if (token) await deleteSession(token);
    return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie('', 0) });
  }

  return json({ error: 'Not found' }, 404);
}
