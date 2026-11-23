import {
  createGroup,
  createPanelUser,
  deleteGroup,
  deletePanelUser,
  getGroups,
  getPanelUserById,
  getPanelUserByUsername,
  getPanelUsers,
  setOwner,
  updateGroup,
  updatePanelUser,
  type PanelUserWithGroup,
} from './db';
import { hasPermission } from './auth';
import { hashPassword } from './password';
import { json, readJson, strings } from './util';

type Role = 'owner' | 'admin' | 'member';
const fail = (error: string, status = 400): Response => json({ ok: false, error }, status);

async function handleUsers(req: Request, path: string, me: PanelUserWithGroup): Promise<Response | null> {
  if (!hasPermission(me, 'manage_panel_users'))
    return json({ error: 'Forbidden: Insufficient permissions to manage panel users.' }, 403);

  if (path === '/api/panel/users') {
    if (req.method === 'GET') return json({ users: await getPanelUsers() });
    if (req.method !== 'POST') return null;

    const body = await readJson(req);
    const username = String(body.username || '').trim();
    const password = String(body.password || '');
    const role = (body.role as Role) || 'member';
    if (username.length < 3) return fail('Username must be at least 3 characters.');
    if (password.length < 4) return fail('Password must be at least 4 characters.');
    if (await getPanelUserByUsername(username)) return fail('Username is already taken.');
    if (role === 'owner' && me.role !== 'owner') return fail('Only the panel Owner can assign Owner status.', 403);

    const id = await createPanelUser({
      username,
      passwordHash: hashPassword(password),
      displayName: String(body.displayName || username).trim(),
      role: role === 'owner' ? 'admin' : role,
      groupId: body.groupId != null ? Number(body.groupId) : null,
      permissions: strings(body.permissions) ?? ['view_dashboard'],
    });
    if (role === 'owner') await setOwner(id);
    return json({ ok: true, user: await getPanelUserById(id), users: await getPanelUsers() });
  }

  const [idPart, action] = path.replace('/api/panel/users/', '').split('/');
  const id = Number(idPart);
  if (!(id > 0)) return json({ error: 'Invalid user ID' }, 400);
  const target = await getPanelUserById(id);
  if (!target) return json({ error: 'User not found' }, 404);

  if (req.method === 'POST' && action === 'owner') {
    if (me.role !== 'owner') return fail('Only the panel Owner can transfer ownership.', 403);
    await setOwner(id);
    return json({ ok: true, users: await getPanelUsers() });
  }

  if (req.method === 'PUT') {
    const body = await readJson(req);
    const username = body.username !== undefined ? String(body.username).trim() : undefined;
    const password = body.password ? String(body.password) : undefined;
    const role = body.role as Role | undefined;
    if (target.role === 'owner' && me.role !== 'owner')
      return fail('Only the panel Owner can modify the Owner account.', 403);
    if (username && username !== target.username) {
      const dup = await getPanelUserByUsername(username);
      if (dup && dup.id !== id) return fail('Username is already taken.');
    }
    if (password && password.length < 4) return fail('Password must be at least 4 characters.');

    await updatePanelUser(id, {
      username,
      passwordHash: password ? hashPassword(password) : undefined,
      displayName: body.displayName !== undefined ? String(body.displayName).trim() : undefined,
      role: role === 'owner' ? undefined : role,
      groupId: body.groupId !== undefined ? (body.groupId !== null ? Number(body.groupId) : null) : undefined,
      permissions: strings(body.permissions),
    });
    if (role === 'owner' && me.role === 'owner') await setOwner(id);
    return json({ ok: true, user: await getPanelUserById(id), users: await getPanelUsers() });
  }

  if (req.method === 'DELETE') {
    if (target.id === me.id) return fail('Cannot delete your own active account.');
    if (target.role === 'owner') return fail('Cannot delete the panel Owner account. Transfer ownership first.');
    await deletePanelUser(id);
    return json({ ok: true, users: await getPanelUsers() });
  }
  return null;
}

async function handleGroups(req: Request, path: string, me: PanelUserWithGroup): Promise<Response | null> {
  if (!hasPermission(me, 'manage_groups') && !hasPermission(me, 'manage_panel_users')) {
    return json({ error: 'Forbidden: Insufficient permissions to manage groups.' }, 403);
  }
  const groups = async () => json({ ok: true, groups: await getGroups() });

  if (path === '/api/panel/groups') {
    if (req.method === 'GET') return json({ groups: await getGroups() });
    if (req.method !== 'POST') return null;
    const body = await readJson(req);
    const name = String(body.name || '').trim();
    if (!name) return fail('Group name is required.');
    await createGroup({
      name,
      description: String(body.description || '').trim(),
      color: String(body.color || '#8b5cf6').trim(),
      permissions: strings(body.permissions) ?? ['view_dashboard'],
    });
    return groups();
  }

  const id = Number(path.replace('/api/panel/groups/', ''));
  if (!(id > 0)) return json({ error: 'Invalid group ID' }, 400);

  if (req.method === 'PUT') {
    const body = await readJson(req);
    const text = (v: unknown) => (v !== undefined ? String(v).trim() : undefined);
    await updateGroup(id, {
      name: text(body.name),
      description: text(body.description),
      color: text(body.color),
      permissions: strings(body.permissions),
    });
    return groups();
  }
  if (req.method === 'DELETE') {
    await deleteGroup(id);
    return groups();
  }
  return null;
}

export async function handlePanel(req: Request, path: string, me: PanelUserWithGroup): Promise<Response> {
  const res = path.startsWith('/api/panel/users')
    ? await handleUsers(req, path, me)
    : path.startsWith('/api/panel/groups')
      ? await handleGroups(req, path, me)
      : null;
  return res ?? json({ error: 'Not found' }, 404);
}
