// Panel storage lives in the bot's own PGlite (single writer, same Bun process). No second database.
type Pg = {
  query: (sql: string, params?: unknown[]) => Promise<{ rows: any[]; affectedRows?: number }>;
  transaction: <T>(fn: (tx: Pg) => Promise<T>) => Promise<T>;
};

let db: Pg;

export async function initPanelDb(pg: Pg): Promise<void> {
  db = pg;
  await db.query(`
    CREATE TABLE IF NOT EXISTS panel_groups (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      description TEXT DEFAULT '',
      color TEXT DEFAULT '#8b5cf6',
      permissions TEXT NOT NULL,
      created_at BIGINT NOT NULL
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS panel_users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT DEFAULT '',
      role TEXT NOT NULL DEFAULT 'member',
      group_id INTEGER REFERENCES panel_groups(id) ON DELETE SET NULL,
      permissions TEXT NOT NULL,
      created_at BIGINT NOT NULL
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS panel_sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES panel_users(id) ON DELETE CASCADE,
      expires_at BIGINT NOT NULL
    )
  `);

  await db.query('CREATE TABLE IF NOT EXISTS panel_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
  await initCatchIndex();

  const count = await db.query('SELECT COUNT(*) AS count FROM panel_groups');
  if (Number(count.rows[0].count) === 0) {
    const now = Date.now();
    const insert = 'INSERT INTO panel_groups (name, description, color, permissions, created_at) VALUES ($1, $2, $3, $4, $5)';
    await db.query(insert, ['Administrators', 'Full administrative control over all panel features and users', '#a855f7', JSON.stringify(['*']), now]);
    await db.query(insert, ['Moderators', 'Moderation access to nation collectibles, bot users, and servers', '#3b82f6', JSON.stringify(['view_dashboard', 'manage_nations', 'manage_users', 'manage_servers']), now]);
    await db.query(insert, ['Viewers', 'Read-only access to statistics and overview analytics', '#10b981', JSON.stringify(['view_dashboard']), now]);
  }
}

export { db };

// Parsing 38k catch rows as JSON takes seconds in PGlite and blocks the bot while it runs. This narrow table holds
// just the fields the panel filters and sorts on, kept current by triggers on the bot's own record table, so the
// panel's catch queries read small indexed rows instead. The trigger can never fail a bot write (errors are swallowed).
async function initCatchIndex(): Promise<void> {
  const present = await db.query("SELECT to_regclass('record') AS t");
  if (!present.rows[0]?.t) return;
  await db.query(`
    CREATE TABLE IF NOT EXISTS panel_catch (
      identifier TEXT PRIMARY KEY,
      id TEXT NOT NULL,
      nation TEXT,
      author TEXT,
      atk TEXT,
      hp TEXT,
      ts BIGINT
    )`);
  await db.query('CREATE INDEX IF NOT EXISTS panel_catch_ts_idx ON panel_catch (ts DESC NULLS LAST, id)');
  await db.query('CREATE INDEX IF NOT EXISTS panel_catch_nation_idx ON panel_catch (nation)');
  await db.query(`
    CREATE OR REPLACE FUNCTION panel_catch_sync() RETURNS trigger AS $fn$
    DECLARE j jsonb; raw text; n numeric;
    BEGIN
      IF TG_OP = 'DELETE' THEN
        DELETE FROM panel_catch WHERE identifier = OLD.identifier;
        RETURN OLD;
      END IF;
      BEGIN
        IF pg_input_is_valid(NEW.value, 'jsonb') THEN j := NEW.value::jsonb; END IF;
        raw := j->>'timestamp';
        IF raw ~ '^[0-9]+(\\.[0-9]+)?$' THEN n := raw::numeric; END IF;
        INSERT INTO panel_catch (identifier, id, nation, author, atk, hp, ts)
        VALUES (NEW.identifier, NEW.id, j->>'id', j->>'author', j->>'attack', j->>'health',
                CASE WHEN n > 100000000000 THEN n::bigint WHEN n > 100000000 THEN (n * 1000)::bigint END)
        ON CONFLICT (identifier) DO UPDATE SET id = EXCLUDED.id, nation = EXCLUDED.nation, author = EXCLUDED.author,
          atk = EXCLUDED.atk, hp = EXCLUDED.hp, ts = EXCLUDED.ts;
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;
      RETURN NEW;
    END
    $fn$ LANGUAGE plpgsql`);
  await db.query('DROP TRIGGER IF EXISTS panel_catch_write ON record');
  await db.query("CREATE TRIGGER panel_catch_write AFTER INSERT OR UPDATE ON record FOR EACH ROW WHEN (NEW.name = 'collectible' AND NEW.type = 'old') EXECUTE FUNCTION panel_catch_sync()");
  await db.query('DROP TRIGGER IF EXISTS panel_catch_delete ON record');
  await db.query("CREATE TRIGGER panel_catch_delete AFTER DELETE ON record FOR EACH ROW WHEN (OLD.name = 'collectible' AND OLD.type = 'old') EXECUTE FUNCTION panel_catch_sync()");
}

// Fills panel_catch from the existing catches in small batches so the bot keeps running while it builds.
export async function backfillCatchIndex(): Promise<void> {
  const present = await db.query("SELECT to_regclass('panel_catch') AS t");
  if (!present.rows[0]?.t) return;
  const [have, want] = await Promise.all([
    db.query('SELECT COUNT(*) AS n FROM panel_catch'),
    db.query("SELECT COUNT(*) AS n FROM record WHERE name = 'collectible' AND type = 'old'"),
  ]);
  if (Number(have.rows[0].n) === Number(want.rows[0].n)) return;
  const ids = (await db.query("SELECT identifier FROM record r WHERE name = 'collectible' AND type = 'old' AND NOT EXISTS (SELECT 1 FROM panel_catch p WHERE p.identifier = r.identifier)")).rows.map((r) => r.identifier as string);
  for (let i = 0; i < ids.length; i += 1000) {
    await db.query(
      `INSERT INTO panel_catch (identifier, id, nation, author, atk, hp, ts)
       SELECT identifier, id, j->>'id', j->>'author', j->>'attack', j->>'health',
              CASE WHEN n > 100000000000 THEN n::bigint WHEN n > 100000000 THEN (n * 1000)::bigint END
       FROM (SELECT identifier, id, j, CASE WHEN j->>'timestamp' ~ '^[0-9]+(\\.[0-9]+)?$' THEN (j->>'timestamp')::numeric END AS n
             FROM (SELECT identifier, id, CASE WHEN pg_input_is_valid(value, 'jsonb') THEN value::jsonb END AS j
                   FROM record WHERE identifier = ANY($1)) a) b
       ON CONFLICT (identifier) DO NOTHING`,
      [ids.slice(i, i + 1000)]
    );
    await new Promise((resolve) => setTimeout(resolve, 5)); // let the bot's own work run between batches
  }
  // Rows removed while the table was not being kept (before the triggers existed).
  await db.query("DELETE FROM panel_catch p WHERE NOT EXISTS (SELECT 1 FROM record r WHERE r.identifier = p.identifier)");
}

export async function getMeta(key: string): Promise<string | null> {
  const res = await db.query('SELECT value FROM panel_meta WHERE key = $1', [key]);
  return res.rows[0]?.value ?? null;
}

export async function setMeta(key: string, value: string): Promise<void> {
  await db.query('INSERT INTO panel_meta (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value', [key, value]);
}

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

export async function hasPassword(): Promise<boolean> {
  const res = await db.query('SELECT 1 FROM panel_users LIMIT 1');
  return res.rows.length > 0;
}

export function parsePermissions(permStr: string): string[] {
  try {
    const parsed = JSON.parse(permStr);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

type UserRow = {
  id: number;
  username: string;
  display_name: string;
  role: 'owner' | 'admin' | 'member';
  group_id: number | null;
  permissions: string;
  created_at: number | string;
  group_name: string | null;
  group_color: string | null;
};

const toUser = (r: UserRow): PanelUserWithGroup => ({
  id: r.id,
  username: r.username,
  displayName: r.display_name,
  role: r.role,
  groupId: r.group_id,
  groupName: r.group_name,
  groupColor: r.group_color,
  permissions: parsePermissions(r.permissions),
  createdAt: Number(r.created_at),
});

const USER_COLS = `u.id, u.username, u.display_name, u.role, u.group_id, u.permissions, u.created_at,
           g.name AS group_name, g.color AS group_color`;

export async function getPanelUsers(): Promise<PanelUserWithGroup[]> {
  const res = await db.query(`
    SELECT ${USER_COLS}
    FROM panel_users u
    LEFT JOIN panel_groups g ON u.group_id = g.id
    ORDER BY CASE WHEN u.role = 'owner' THEN 0 WHEN u.role = 'admin' THEN 1 ELSE 2 END, u.id ASC
  `);
  return res.rows.map(toUser);
}

export async function getPanelUserById(id: number): Promise<PanelUserWithGroup | null> {
  const res = await db.query(`
    SELECT ${USER_COLS}
    FROM panel_users u
    LEFT JOIN panel_groups g ON u.group_id = g.id
    WHERE u.id = $1
  `, [id]);
  return res.rows[0] ? toUser(res.rows[0]) : null;
}

export async function getPanelUserByUsername(username: string): Promise<(DbPanelUser & { group_name?: string; group_color?: string }) | null> {
  const res = await db.query(`
    SELECT u.*, g.name AS group_name, g.color AS group_color
    FROM panel_users u
    LEFT JOIN panel_groups g ON u.group_id = g.id
    WHERE LOWER(u.username) = LOWER($1)
  `, [username]);
  const row = res.rows[0];
  return row ? { ...row, created_at: Number(row.created_at) } : null;
}

export async function createPanelUser(data: {
  username: string;
  passwordHash: string;
  displayName?: string;
  role?: 'owner' | 'admin' | 'member';
  groupId?: number | null;
  permissions?: string[];
}): Promise<number> {
  const res = await db.query(`
    INSERT INTO panel_users (username, password_hash, display_name, role, group_id, permissions, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id
  `, [
    data.username,
    data.passwordHash,
    data.displayName ?? data.username,
    data.role ?? 'member',
    data.groupId ?? null,
    JSON.stringify(data.permissions ?? ['view_dashboard']),
    Date.now(),
  ]);
  return Number(res.rows[0].id);
}

export async function updatePanelUser(
  id: number,
  data: {
    username?: string;
    passwordHash?: string;
    displayName?: string;
    role?: 'owner' | 'admin' | 'member';
    groupId?: number | null;
    permissions?: string[];
  }
): Promise<void> {
  const cur = (await db.query('SELECT * FROM panel_users WHERE id = $1', [id])).rows[0] as DbPanelUser | undefined;
  if (!cur) return;

  await db.query(`
    UPDATE panel_users
    SET username = $1, password_hash = $2, display_name = $3, role = $4, group_id = $5, permissions = $6
    WHERE id = $7
  `, [
    data.username ?? cur.username,
    data.passwordHash ?? cur.password_hash,
    data.displayName ?? cur.display_name,
    data.role ?? cur.role,
    data.groupId !== undefined ? data.groupId : cur.group_id,
    data.permissions !== undefined ? JSON.stringify(data.permissions) : cur.permissions,
    id,
  ]);
}

export async function deletePanelUser(id: number): Promise<void> {
  await db.query('DELETE FROM panel_users WHERE id = $1', [id]);
}

export async function setOwner(newOwnerId: number): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.query("UPDATE panel_users SET role = 'admin' WHERE role = 'owner'");
    await tx.query("UPDATE panel_users SET role = 'owner', permissions = $1 WHERE id = $2", [JSON.stringify(['*']), newOwnerId]);
  });
}

export async function getGroups(): Promise<GroupWithCount[]> {
  const res = await db.query(`
    SELECT g.*, COUNT(u.id) AS member_count
    FROM panel_groups g
    LEFT JOIN panel_users u ON u.group_id = g.id
    GROUP BY g.id
    ORDER BY g.id ASC
  `);
  return res.rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    color: r.color,
    permissions: parsePermissions(r.permissions),
    createdAt: Number(r.created_at),
    memberCount: Number(r.member_count),
  }));
}

export async function createGroup(data: {
  name: string;
  description?: string;
  color?: string;
  permissions?: string[];
}): Promise<number> {
  const res = await db.query(`
    INSERT INTO panel_groups (name, description, color, permissions, created_at)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
  `, [
    data.name,
    data.description ?? '',
    data.color ?? '#8b5cf6',
    JSON.stringify(data.permissions ?? ['view_dashboard']),
    Date.now(),
  ]);
  return Number(res.rows[0].id);
}

export async function updateGroup(
  id: number,
  data: {
    name?: string;
    description?: string;
    color?: string;
    permissions?: string[];
  }
): Promise<void> {
  const cur = (await db.query('SELECT * FROM panel_groups WHERE id = $1', [id])).rows[0] as DbGroup | undefined;
  if (!cur) return;

  await db.query(`
    UPDATE panel_groups
    SET name = $1, description = $2, color = $3, permissions = $4
    WHERE id = $5
  `, [
    data.name ?? cur.name,
    data.description ?? cur.description,
    data.color ?? cur.color,
    data.permissions !== undefined ? JSON.stringify(data.permissions) : cur.permissions,
    id,
  ]);
}

export async function deleteGroup(id: number): Promise<void> {
  await db.query('DELETE FROM panel_groups WHERE id = $1', [id]);
}

export async function createSession(token: string, userId: number, expiresAt: number): Promise<void> {
  await db.query('INSERT INTO panel_sessions (token, user_id, expires_at) VALUES ($1, $2, $3)', [token, userId, expiresAt]);
}

export async function deleteSession(token: string): Promise<void> {
  await db.query('DELETE FROM panel_sessions WHERE token = $1', [token]);
}

export async function getSessionUser(token: string): Promise<PanelUserWithGroup | null> {
  const res = await db.query(`
    SELECT s.expires_at, ${USER_COLS}, g.permissions AS group_permissions
    FROM panel_sessions s
    JOIN panel_users u ON s.user_id = u.id
    LEFT JOIN panel_groups g ON u.group_id = g.id
    WHERE s.token = $1
  `, [token]);
  const row = res.rows[0];
  if (!row) return null;
  if (Number(row.expires_at) < Date.now()) {
    await deleteSession(token);
    return null;
  }

  const userPerms = parsePermissions(row.permissions);
  const groupPerms = row.group_permissions ? parsePermissions(row.group_permissions) : [];
  const mergedPerms = Array.from(new Set([...userPerms, ...groupPerms]));
  const user = toUser(row);
  return { ...user, permissions: row.role === 'owner' || mergedPerms.includes('*') ? ['*'] : mergedPerms };
}

export async function purgeExpiredSessions(): Promise<void> {
  await db.query('DELETE FROM panel_sessions WHERE expires_at < $1', [Date.now()]);
}

export async function setPasswordHashForAdmin(hash: string): Promise<void> {
  const adminUser = await getPanelUserByUsername('admin');
  if (adminUser) {
    await updatePanelUser(adminUser.id, { passwordHash: hash });
    return;
  }
  const first = (await db.query('SELECT id FROM panel_users ORDER BY id ASC LIMIT 1')).rows[0];
  if (first) {
    await updatePanelUser(first.id, { passwordHash: hash });
  } else {
    await createPanelUser({
      username: 'admin',
      passwordHash: hash,
      displayName: 'Panel Owner',
      role: 'owner',
      permissions: ['*'],
    });
  }
}
