import { mkdirSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import Database from 'better-sqlite3';

const dataDir = path.join(process.cwd(), 'data');
mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'admin.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT DEFAULT '',
    color TEXT DEFAULT '#8b5cf6',
    permissions TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS panel_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT DEFAULT '',
    role TEXT NOT NULL DEFAULT 'member',
    group_id INTEGER,
    permissions TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL
  );
`);

try {
  const sessionCols = db.prepare("PRAGMA table_info(sessions)").all() as Array<{ name: string }>;
  const hasUserId = sessionCols.some((c) => c.name === 'user_id');
  if (sessionCols.length === 0 || !hasUserId) {
    if (sessionCols.length > 0) {
      db.exec("DROP TABLE sessions");
    }
    db.exec(`
      CREATE TABLE sessions (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        expires_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES panel_users(id) ON DELETE CASCADE
      );
    `);
  }
} catch {
}

function seedDefaultGroups(): void {
  const count = db.prepare('SELECT COUNT(*) as count FROM groups').get() as { count: number };
  if (count.count === 0) {
    const now = Date.now();
    const insert = db.prepare('INSERT INTO groups (name, description, color, permissions, created_at) VALUES (?, ?, ?, ?, ?)');
    insert.run('Administrators', 'Full administrative control over all panel features and users', '#a855f7', JSON.stringify(['*']), now);
    insert.run('Moderators', 'Moderation access to nation collectibles, bot users, and servers', '#3b82f6', JSON.stringify(['view_dashboard', 'manage_nations', 'manage_users', 'manage_servers']), now);
    insert.run('Viewers', 'Read-only access to statistics and overview analytics', '#10b981', JSON.stringify(['view_dashboard']), now);
  }
}

seedDefaultGroups();

try {
  const oldAuth = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='auth'").get();
  if (oldAuth) {
    const oldRow = db.prepare('SELECT password_hash FROM auth WHERE id = 1').get() as { password_hash: string } | undefined;
    const userCount = db.prepare('SELECT COUNT(*) as count FROM panel_users').get() as { count: number };
    if (oldRow?.password_hash && userCount.count === 0) {
      const adminGroup = db.prepare("SELECT id FROM groups WHERE name = 'Administrators'").get() as { id: number } | undefined;
      db.prepare(`
        INSERT INTO panel_users (username, password_hash, display_name, role, group_id, permissions, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run('admin', oldRow.password_hash, 'Panel Owner', 'owner', adminGroup?.id ?? 1, JSON.stringify(['*']), Date.now());
    }
  }
} catch {
}

export { db };

export type DbPanelUser = {
  id: number;
  username: string;
  password_hash: string;
  display_name: string;
  role: 'owner' | 'admin' | 'member';
  group_id: number | null;
  permissions: string;
  created_at: number;
};

export type DbGroup = {
  id: number;
  name: string;
  description: string;
  color: string;
  permissions: string;
  created_at: number;
};

export type PanelUserWithGroup = {
  id: number;
  username: string;
  displayName: string;
  role: 'owner' | 'admin' | 'member';
  groupId: number | null;
  groupName: string | null;
  groupColor: string | null;
  permissions: string[];
  createdAt: number;
};

export type GroupWithCount = {
  id: number;
  name: string;
  description: string;
  color: string;
  permissions: string[];
  createdAt: number;
  memberCount: number;
};

export function hasPassword(): boolean {
  const row = db.prepare('SELECT 1 FROM panel_users LIMIT 1').get();
  return !!row;
}

export function parsePermissions(permStr: string): string[] {
  try {
    const parsed = JSON.parse(permStr);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function getPanelUsers(): PanelUserWithGroup[] {
  const rows = db.prepare(`
    SELECT u.id, u.username, u.display_name, u.role, u.group_id, u.permissions, u.created_at,
           g.name as group_name, g.color as group_color
    FROM panel_users u
    LEFT JOIN groups g ON u.group_id = g.id
    ORDER BY CASE WHEN u.role = 'owner' THEN 0 WHEN u.role = 'admin' THEN 1 ELSE 2 END, u.id ASC
  `).all() as Array<{
    id: number;
    username: string;
    display_name: string;
    role: 'owner' | 'admin' | 'member';
    group_id: number | null;
    permissions: string;
    created_at: number;
    group_name: string | null;
    group_color: string | null;
  }>;

  return rows.map((r) => ({
    id: r.id,
    username: r.username,
    displayName: r.display_name,
    role: r.role,
    groupId: r.group_id,
    groupName: r.group_name,
    groupColor: r.group_color,
    permissions: parsePermissions(r.permissions),
    createdAt: r.created_at,
  }));
}

export function getPanelUserById(id: number): PanelUserWithGroup | null {
  const r = db.prepare(`
    SELECT u.id, u.username, u.display_name, u.role, u.group_id, u.permissions, u.created_at,
           g.name as group_name, g.color as group_color
    FROM panel_users u
    LEFT JOIN groups g ON u.group_id = g.id
    WHERE u.id = ?
  `).get(id) as {
    id: number;
    username: string;
    display_name: string;
    role: 'owner' | 'admin' | 'member';
    group_id: number | null;
    permissions: string;
    created_at: number;
    group_name: string | null;
    group_color: string | null;
  } | undefined;

  if (!r) return null;
  return {
    id: r.id,
    username: r.username,
    displayName: r.display_name,
    role: r.role,
    groupId: r.group_id,
    groupName: r.group_name,
    groupColor: r.group_color,
    permissions: parsePermissions(r.permissions),
    createdAt: r.created_at,
  };
}

export function getPanelUserByUsername(username: string): (DbPanelUser & { group_name?: string; group_color?: string }) | null {
  const row = db.prepare(`
    SELECT u.*, g.name as group_name, g.color as group_color
    FROM panel_users u
    LEFT JOIN groups g ON u.group_id = g.id
    WHERE LOWER(u.username) = LOWER(?)
  `).get(username) as (DbPanelUser & { group_name?: string; group_color?: string }) | undefined;

  return row ?? null;
}

export function createPanelUser(data: {
  username: string;
  passwordHash: string;
  displayName?: string;
  role?: 'owner' | 'admin' | 'member';
  groupId?: number | null;
  permissions?: string[];
}): number {
  const role = data.role ?? 'member';
  const displayName = data.displayName ?? data.username;
  const groupId = data.groupId ?? null;
  const permissions = JSON.stringify(data.permissions ?? ['view_dashboard']);
  const now = Date.now();

  const res = db.prepare(`
    INSERT INTO panel_users (username, password_hash, display_name, role, group_id, permissions, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(data.username, data.passwordHash, displayName, role, groupId, permissions, now);

  return Number(res.lastInsertRowid);
}

export function updatePanelUser(
  id: number,
  data: {
    username?: string;
    passwordHash?: string;
    displayName?: string;
    role?: 'owner' | 'admin' | 'member';
    groupId?: number | null;
    permissions?: string[];
  }
): void {
  const current = db.prepare('SELECT * FROM panel_users WHERE id = ?').get(id) as DbPanelUser | undefined;
  if (!current) return;

  const username = data.username ?? current.username;
  const passwordHash = data.passwordHash ?? current.password_hash;
  const displayName = data.displayName ?? current.display_name;
  const role = data.role ?? current.role;
  const groupId = data.groupId !== undefined ? data.groupId : current.group_id;
  const permissions = data.permissions !== undefined ? JSON.stringify(data.permissions) : current.permissions;

  db.prepare(`
    UPDATE panel_users
    SET username = ?, password_hash = ?, display_name = ?, role = ?, group_id = ?, permissions = ?
    WHERE id = ?
  `).run(username, passwordHash, displayName, role, groupId, permissions, id);
}

export function deletePanelUser(id: number): void {
  db.prepare('DELETE FROM panel_users WHERE id = ?').run(id);
}

export function setOwner(newOwnerId: number): void {
  db.transaction(() => {
    db.prepare("UPDATE panel_users SET role = 'admin' WHERE role = 'owner'").run();
    db.prepare("UPDATE panel_users SET role = 'owner', permissions = ? WHERE id = ?").run(JSON.stringify(['*']), newOwnerId);
  })();
}

export function getGroups(): GroupWithCount[] {
  const rows = db.prepare(`
    SELECT g.*, COUNT(u.id) as member_count
    FROM groups g
    LEFT JOIN panel_users u ON u.group_id = g.id
    GROUP BY g.id
    ORDER BY g.id ASC
  `).all() as Array<{
    id: number;
    name: string;
    description: string;
    color: string;
    permissions: string;
    created_at: number;
    member_count: number;
  }>;

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    color: r.color,
    permissions: parsePermissions(r.permissions),
    createdAt: r.created_at,
    memberCount: r.member_count,
  }));
}

export function createGroup(data: {
  name: string;
  description?: string;
  color?: string;
  permissions?: string[];
}): number {
  const description = data.description ?? '';
  const color = data.color ?? '#8b5cf6';
  const permissions = JSON.stringify(data.permissions ?? ['view_dashboard']);
  const now = Date.now();

  const res = db.prepare(`
    INSERT INTO groups (name, description, color, permissions, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(data.name, description, color, permissions, now);

  return Number(res.lastInsertRowid);
}

export function updateGroup(
  id: number,
  data: {
    name?: string;
    description?: string;
    color?: string;
    permissions?: string[];
  }
): void {
  const current = db.prepare('SELECT * FROM groups WHERE id = ?').get(id) as DbGroup | undefined;
  if (!current) return;

  const name = data.name ?? current.name;
  const description = data.description ?? current.description;
  const color = data.color ?? current.color;
  const permissions = data.permissions !== undefined ? JSON.stringify(data.permissions) : current.permissions;

  db.prepare(`
    UPDATE groups
    SET name = ?, description = ?, color = ?, permissions = ?
    WHERE id = ?
  `).run(name, description, color, permissions, id);
}

export function deleteGroup(id: number): void {
  db.prepare('DELETE FROM groups WHERE id = ?').run(id);
}

export function createSession(token: string, userId: number, expiresAt: number): void {
  db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(token, userId, expiresAt);
}

export function deleteSession(token: string): void {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

export function getSessionUser(token: string): PanelUserWithGroup | null {
  const row = db.prepare(`
    SELECT s.expires_at, u.id, u.username, u.display_name, u.role, u.group_id, u.permissions, u.created_at,
           g.name as group_name, g.color as group_color, g.permissions as group_permissions
    FROM sessions s
    JOIN panel_users u ON s.user_id = u.id
    LEFT JOIN groups g ON u.group_id = g.id
    WHERE s.token = ?
  `).get(token) as {
    expires_at: number;
    id: number;
    username: string;
    display_name: string;
    role: 'owner' | 'admin' | 'member';
    group_id: number | null;
    permissions: string;
    created_at: number;
    group_name: string | null;
    group_color: string | null;
    group_permissions: string | null;
  } | undefined;

  if (!row) return null;
  if (row.expires_at < Date.now()) {
    deleteSession(token);
    return null;
  }

  const userPerms = parsePermissions(row.permissions);
  const groupPerms = row.group_permissions ? parsePermissions(row.group_permissions) : [];
  const mergedPerms = Array.from(new Set([...userPerms, ...groupPerms]));

  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    role: row.role,
    groupId: row.group_id,
    groupName: row.group_name,
    groupColor: row.group_color,
    permissions: row.role === 'owner' || mergedPerms.includes('*') ? ['*'] : mergedPerms,
    createdAt: row.created_at,
  };
}

export function purgeExpiredSessions(): void {
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now());
}

export function setPasswordHashForAdmin(hash: string): void {
  const adminUser = getPanelUserByUsername('admin');
  if (adminUser) {
    updatePanelUser(adminUser.id, { passwordHash: hash });
  } else {
    const firstUser = db.prepare('SELECT id FROM panel_users ORDER BY id ASC LIMIT 1').get() as { id: number } | undefined;
    if (firstUser) {
      updatePanelUser(firstUser.id, { passwordHash: hash });
    } else {
      createPanelUser({
        username: 'admin',
        passwordHash: hash,
        displayName: 'Panel Owner',
        role: 'owner',
        permissions: ['*'],
      });
    }
  }
}