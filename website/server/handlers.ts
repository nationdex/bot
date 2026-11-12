import { randomBytes } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { serverConfig } from './config';
import { createGroup, createPanelUser, createSession, deleteGroup, deletePanelUser, deleteSession, getGroups, getPanelUserById, getPanelUserByUsername, getPanelUsers, getSessionUser, hasPassword, purgeExpiredSessions, setOwner, updateGroup, updatePanelUser, type PanelUserWithGroup } from './db';
import { hashPassword, verifyPassword } from './password';

const SESSION_COOKIE = 'admin_session';
const SESSION_MS = 7 * 24 * 60 * 60 * 1000;

function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {};
  return Object.fromEntries(
    header.split(';').map((part) => {
      const [k, ...rest] = part.trim().split('=');
      return [k, rest.join('=')];
    })
  );
}

function getSessionToken(req: IncomingMessage): string | undefined {
  return parseCookies(req.headers.cookie)[SESSION_COOKIE];
}

function setSessionCookie(res: ServerResponse, token: string): void {
  const maxAge = Math.floor(SESSION_MS / 1000);
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`
  );
}

function clearSessionCookie(res: ServerResponse): void {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function getAuthenticatedUser(req: IncomingMessage): PanelUserWithGroup | null {
  const token = getSessionToken(req);
  if (!token) return null;
  purgeExpiredSessions();
  return getSessionUser(token);
}

function hasPermission(user: PanelUserWithGroup | null, perm: string): boolean {
  if (!user) return false;
  if (user.role === 'owner' || user.permissions.includes('*')) return true;
  return user.permissions.includes(perm);
}

export async function handleAdminApi(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = req.url ?? '';
  if (!url.startsWith('/api/auth') && !url.startsWith('/api/panel') && !url.startsWith('/api/bot')) return false;

  const [path, queryString] = url.split('?');
  const querySuffix = queryString ? `?${queryString}` : '';

  if (url.startsWith('/api/auth')) {
    if (req.method === 'GET' && path === '/api/auth/status') {
      sendJson(res, 200, { needsSetup: !hasPassword() });
      return true;
    }

    if (req.method === 'GET' && path === '/api/auth/session') {
      const currentUser = getAuthenticatedUser(req);
      sendJson(res, 200, {
        authenticated: !!currentUser,
        user: currentUser,
      });
      return true;
    }

    if (req.method === 'POST' && path === '/api/auth/setup') {
      if (hasPassword()) {
        sendJson(res, 403, { ok: false, error: 'Admin panel is already configured.' });
        return true;
      }
      const body = await readJson(req);
      const password = String(body.password || '');
      const username = String(body.username || 'admin').trim() || 'admin';
      const displayName = String(body.displayName || 'Panel Owner').trim() || 'Panel Owner';

      if (!password || password.length < 4) {
        sendJson(res, 400, { ok: false, error: 'Password must be at least 4 characters.' });
        return true;
      }

      const adminGroup = getGroups().find((g) => g.name === 'Administrators');
      const userId = createPanelUser({
        username,
        passwordHash: hashPassword(password),
        displayName,
        role: 'owner',
        groupId: adminGroup?.id ?? 1,
        permissions: ['*'],
      });

      const token = randomBytes(32).toString('hex');
      createSession(token, userId, Date.now() + SESSION_MS);
      setSessionCookie(res, token);

      sendJson(res, 200, { ok: true, user: getPanelUserById(userId) });
      return true;
    }

    if (req.method === 'POST' && path === '/api/auth/login') {
      const body = await readJson(req);
      const password = String(body.password || '');
      const username = String(body.username || '').trim();

      if (!password) {
        sendJson(res, 400, { ok: false, error: 'Password is required.' });
        return true;
      }

      let targetUser = username ? getPanelUserByUsername(username) : getPanelUserByUsername('admin');
      if (!targetUser && !username) {
        const allUsers = getPanelUsers();
        if (allUsers.length > 0) {
          targetUser = getPanelUserByUsername(allUsers[0].username);
        }
      }

      if (!targetUser || !verifyPassword(password, targetUser.password_hash)) {
        sendJson(res, 401, { ok: false, error: 'Invalid username or password.' });
        return true;
      }

      const token = randomBytes(32).toString('hex');
      createSession(token, targetUser.id, Date.now() + SESSION_MS);
      setSessionCookie(res, token);

      sendJson(res, 200, { ok: true, user: getPanelUserById(targetUser.id) });
      return true;
    }

    if (req.method === 'POST' && path === '/api/auth/logout') {
      const token = getSessionToken(req);
      if (token) deleteSession(token);
      clearSessionCookie(res);
      sendJson(res, 200, { ok: true });
      return true;
    }

    sendJson(res, 404, { error: 'Not found' });
    return true;
  }

  if (url.startsWith('/api/panel')) {
    const currentUser = getAuthenticatedUser(req);
    if (!currentUser) {
      sendJson(res, 401, { error: 'Unauthorized' });
      return true;
    }

    if (path === '/api/panel/users') {
      if (!hasPermission(currentUser, 'manage_panel_users')) {
        sendJson(res, 403, { error: 'Forbidden: Insufficient permissions to manage panel users.' });
        return true;
      }

      if (req.method === 'GET') {
        sendJson(res, 200, { users: getPanelUsers() });
        return true;
      }

      if (req.method === 'POST') {
        const body = await readJson(req);
        const username = String(body.username || '').trim();
        const password = String(body.password || '');
        const displayName = String(body.displayName || username).trim();
        const role = (body.role as 'owner' | 'admin' | 'member') || 'member';
        const groupId = body.groupId !== undefined && body.groupId !== null ? Number(body.groupId) : null;
        const permissions = Array.isArray(body.permissions) ? body.permissions.map(String) : ['view_dashboard'];

        if (!username || username.length < 3) {
          sendJson(res, 400, { ok: false, error: 'Username must be at least 3 characters.' });
          return true;
        }
        if (!password || password.length < 4) {
          sendJson(res, 400, { ok: false, error: 'Password must be at least 4 characters.' });
          return true;
        }

        const existing = getPanelUserByUsername(username);
        if (existing) {
          sendJson(res, 400, { ok: false, error: 'Username is already taken.' });
          return true;
        }

        if (role === 'owner' && currentUser.role !== 'owner') {
          sendJson(res, 403, { ok: false, error: 'Only the panel Owner can assign Owner status.' });
          return true;
        }

        const newId = createPanelUser({
          username,
          passwordHash: hashPassword(password),
          displayName,
          role: role === 'owner' ? 'admin' : role,
          groupId,
          permissions,
        });

        if (role === 'owner' && currentUser.role === 'owner') {
          setOwner(newId);
        }

        sendJson(res, 200, { ok: true, user: getPanelUserById(newId), users: getPanelUsers() });
        return true;
      }
    }

    if (path.startsWith('/api/panel/users/')) {
      if (!hasPermission(currentUser, 'manage_panel_users')) {
        sendJson(res, 403, { error: 'Forbidden: Insufficient permissions to manage panel users.' });
        return true;
      }

      const sub = path.replace('/api/panel/users/', '');
      const parts = sub.split('/');
      const targetId = Number(parts[0]);

      if (isNaN(targetId) || targetId <= 0) {
        sendJson(res, 400, { error: 'Invalid user ID' });
        return true;
      }

      const targetUser = getPanelUserById(targetId);
      if (!targetUser) {
        sendJson(res, 404, { error: 'User not found' });
        return true;
      }

      if (req.method === 'POST' && parts[1] === 'owner') {
        if (currentUser.role !== 'owner') {
          sendJson(res, 403, { ok: false, error: 'Only the panel Owner can transfer ownership.' });
          return true;
        }
        setOwner(targetId);
        sendJson(res, 200, { ok: true, users: getPanelUsers() });
        return true;
      }

      if (req.method === 'PUT') {
        const body = await readJson(req);
        const username = body.username !== undefined ? String(body.username).trim() : undefined;
        const password = body.password ? String(body.password) : undefined;
        const displayName = body.displayName !== undefined ? String(body.displayName).trim() : undefined;
        const role = body.role as 'owner' | 'admin' | 'member' | undefined;
        const groupId = body.groupId !== undefined ? (body.groupId !== null ? Number(body.groupId) : null) : undefined;
        const permissions = Array.isArray(body.permissions) ? body.permissions.map(String) : undefined;

        if (targetUser.role === 'owner' && currentUser.role !== 'owner') {
          sendJson(res, 403, { ok: false, error: 'Only the panel Owner can modify the Owner account.' });
          return true;
        }

        if (username && username !== targetUser.username) {
          const dup = getPanelUserByUsername(username);
          if (dup && dup.id !== targetId) {
            sendJson(res, 400, { ok: false, error: 'Username is already taken.' });
            return true;
          }
        }

        if (password && password.length < 4) {
          sendJson(res, 400, { ok: false, error: 'Password must be at least 4 characters.' });
          return true;
        }

        updatePanelUser(targetId, {
          username,
          passwordHash: password ? hashPassword(password) : undefined,
          displayName,
          role: role === 'owner' ? undefined : role,
          groupId,
          permissions,
        });

        if (role === 'owner' && currentUser.role === 'owner') {
          setOwner(targetId);
        }

        sendJson(res, 200, { ok: true, user: getPanelUserById(targetId), users: getPanelUsers() });
        return true;
      }

      if (req.method === 'DELETE') {
        if (targetUser.id === currentUser.id) {
          sendJson(res, 400, { ok: false, error: 'Cannot delete your own active account.' });
          return true;
        }
        if (targetUser.role === 'owner') {
          sendJson(res, 400, { ok: false, error: 'Cannot delete the panel Owner account. Transfer ownership first.' });
          return true;
        }
        deletePanelUser(targetId);
        sendJson(res, 200, { ok: true, users: getPanelUsers() });
        return true;
      }
    }

    if (path === '/api/panel/groups') {
      if (!hasPermission(currentUser, 'manage_groups') && !hasPermission(currentUser, 'manage_panel_users')) {
        sendJson(res, 403, { error: 'Forbidden: Insufficient permissions to manage groups.' });
        return true;
      }

      if (req.method === 'GET') {
        sendJson(res, 200, { groups: getGroups() });
        return true;
      }

      if (req.method === 'POST') {
        const body = await readJson(req);
        const name = String(body.name || '').trim();
        const description = String(body.description || '').trim();
        const color = String(body.color || '#8b5cf6').trim();
        const permissions = Array.isArray(body.permissions) ? body.permissions.map(String) : ['view_dashboard'];

        if (!name) {
          sendJson(res, 400, { ok: false, error: 'Group name is required.' });
          return true;
        }

        createGroup({ name, description, color, permissions });
        sendJson(res, 200, { ok: true, groups: getGroups() });
        return true;
      }
    }

    if (path.startsWith('/api/panel/groups/')) {
      if (!hasPermission(currentUser, 'manage_groups') && !hasPermission(currentUser, 'manage_panel_users')) {
        sendJson(res, 403, { error: 'Forbidden: Insufficient permissions to manage groups.' });
        return true;
      }

      const groupId = Number(path.replace('/api/panel/groups/', ''));
      if (isNaN(groupId) || groupId <= 0) {
        sendJson(res, 400, { error: 'Invalid group ID' });
        return true;
      }

      if (req.method === 'PUT') {
        const body = await readJson(req);
        const name = body.name !== undefined ? String(body.name).trim() : undefined;
        const description = body.description !== undefined ? String(body.description).trim() : undefined;
        const color = body.color !== undefined ? String(body.color).trim() : undefined;
        const permissions = Array.isArray(body.permissions) ? body.permissions.map(String) : undefined;

        updateGroup(groupId, { name, description, color, permissions });
        sendJson(res, 200, { ok: true, groups: getGroups() });
        return true;
      }

      if (req.method === 'DELETE') {
        deleteGroup(groupId);
        sendJson(res, 200, { ok: true, groups: getGroups() });
        return true;
      }
    }

    sendJson(res, 404, { error: 'Not found' });
    return true;
  }

  if (path.startsWith('/api/bot/cards/') && path.endsWith('/image')) {
    if (!serverConfig.apiBaseUrl) {
      sendJson(res, 502, { error: 'API_BASE_URL is not configured' });
      return true;
    }
    const cardId = path.replace('/api/bot/cards/', '').replace('/image', '').trim();
    const cleanId = decodeURIComponent(cardId).replace(/\.(png|jpg|webp|svg)$/i, '');
    const upstreamUrl = `${serverConfig.apiBaseUrl.replace(/\/$/, '')}/cards/${encodeURIComponent(cleanId)}/image`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const headers: Record<string, string> = {};
      if (serverConfig.apiToken) headers['Authorization'] = `Bearer ${serverConfig.apiToken}`;
      const uRes = await fetch(upstreamUrl, { headers, signal: controller.signal });
      clearTimeout(timeout);

      if (uRes.ok) {
        const ct = uRes.headers.get('content-type') || 'image/png';
        const buf = Buffer.from(await uRes.arrayBuffer());
        res.statusCode = 200;
        res.setHeader('Content-Type', ct);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.end(buf);
        return true;
      }
      sendJson(res, uRes.status, { error: 'Card Not Found' });
      return true;
    } catch {
      sendJson(res, 404, { error: 'Card Not Found' });
      return true;
    }
  }

  if (path.startsWith('/api/bot/cards/image/')) {
    if (!serverConfig.apiBaseUrl) {
      sendJson(res, 502, { error: 'API_BASE_URL is not configured' });
      return true;
    }
    const rawId = path.replace('/api/bot/cards/image/', '').trim();
    const cleanId = decodeURIComponent(rawId).replace(/\.(png|jpg|webp|svg)$/i, '');
    const upstreamUrl = `${serverConfig.apiBaseUrl.replace(/\/$/, '')}/cards/${encodeURIComponent(cleanId)}/image`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const headers: Record<string, string> = {};
      if (serverConfig.apiToken) headers['Authorization'] = `Bearer ${serverConfig.apiToken}`;
      const uRes = await fetch(upstreamUrl, { headers, signal: controller.signal });
      clearTimeout(timeout);

      if (uRes.ok) {
        const ct = uRes.headers.get('content-type') || 'image/png';
        const buf = Buffer.from(await uRes.arrayBuffer());
        res.statusCode = 200;
        res.setHeader('Content-Type', ct);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.end(buf);
        return true;
      }
      sendJson(res, uRes.status, { error: 'Card Not Found' });
      return true;
    } catch {
      sendJson(res, 404, { error: 'Card Not Found' });
      return true;
    }
  }

  const currentUser = getAuthenticatedUser(req);
  if (!currentUser) {
    sendJson(res, 401, { error: 'Unauthorized' });
    return true;
  }

  let upstreamPath = '';
  if (path === '/api/bot/stats') {
    upstreamPath = serverConfig.routes.stats;
  } else if (path === '/api/bot/collectibles' || path === '/api/bot/collectibles/data') {
    upstreamPath = serverConfig.routes.collectibles;
  } else if (path === '/api/bot/config') {
    upstreamPath = serverConfig.routes.config;
  } else if (path === '/api/bot/config/add') {
    upstreamPath = serverConfig.routes.configAdd;
  } else if (path === '/api/bot/config/delete') {
    upstreamPath = serverConfig.routes.configDelete;
  } else if (path === '/api/bot/config/reset') {
    upstreamPath = serverConfig.routes.configReset;
  } else if (path === '/api/bot/user') {
    upstreamPath = serverConfig.routes.user;
  } else if (path.startsWith('/api/bot/users')) {
    const sub = path.replace('/api/bot/users', '');
    upstreamPath = `${serverConfig.routes.users}${sub}`;
  } else if (path.startsWith('/api/bot/search_db/')) {
    const variable = path.replace('/api/bot/search_db/', '');
    upstreamPath = `${serverConfig.routes.searchDb}/${variable}`;
  } else if (path.startsWith('/api/bot/nations')) {
    const sub = path.replace('/api/bot/nations', '');
    upstreamPath = `${serverConfig.routes.nations}${sub}`;
  } else if (path.startsWith('/api/bot/nation/cards/')) {
    const id = path.replace('/api/bot/nation/cards/', '');
    upstreamPath = `${serverConfig.routes.nations}/${id}/card`;
  } else if (path.startsWith('/api/bot/nation/')) {
    const id = path.replace('/api/bot/nation/', '');
    upstreamPath = `${serverConfig.routes.nations}/${id}`;
  } else if (path === '/api/bot/cards' || path === '/api/bot/cards/') {
    upstreamPath = serverConfig.routes.cards;
  } else if (path.startsWith('/api/bot/cards/backgrounds')) {
    const sub = path.replace('/api/bot/cards/backgrounds', '');
    upstreamPath = `${serverConfig.routes.cardsBackgrounds}${sub}`;
  } else {
    upstreamPath = path.replace('/api/bot', '');
  }

  if (!serverConfig.apiBaseUrl) {
    sendJson(res, 502, { error: 'API_BASE_URL is not configured' });
    return true;
  }

  const upstreamUrl = `${serverConfig.apiBaseUrl.replace(/\/$/, '')}${upstreamPath}${querySuffix}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), serverConfig.timeoutMs);
    let requestBody: string | undefined;

    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH' || req.method === 'DELETE') {
      const jsonBody = await readJson(req);
      requestBody = jsonBody !== undefined ? JSON.stringify(jsonBody) : undefined;
    }

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
    if (serverConfig.apiToken) {
      headers['Authorization'] = `Bearer ${serverConfig.apiToken}`;
    }

    const response = await fetch(upstreamUrl, {
      method: req.method,
      headers,
      body: requestBody,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.ok) {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('image/') || contentType.includes('application/octet-stream')) {
        const arrayBuffer = await response.arrayBuffer();
        res.statusCode = response.status;
        res.setHeader('Content-Type', contentType);
        res.end(Buffer.from(arrayBuffer));
        return true;
      }
      let data: unknown = await response.json();

      if (typeof data === 'string' && data.trim().startsWith('{')) {
        const strData = data;
        try {
          data = JSON.parse(strData);
        } catch {
          const match = strData.match(/\{[\s\S]*?\}/);
          if (match) {
            try {
              data = JSON.parse(match[0]);
            } catch {}
          }
        }
      }

      sendJson(res, response.status, data);
      return true;
    }

    try {
      const errJson = await response.json();
      sendJson(res, response.status, errJson);
      return true;
    } catch {
      sendJson(res, response.status, {
        ok: false,
        status: response.status,
        statusText: response.statusText,
        error: response.statusText,
      });
      return true;
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Upstream API error';
    sendJson(res, 502, {
      ok: false,
      status: 502,
      error: errorMsg,
    });
    return true;
  }

  sendJson(res, 404, { error: 'Not found' });
  return true;
}