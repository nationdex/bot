export type PanelUser = {
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

export type PanelGroup = {
  id: number;
  name: string;
  description: string;
  color: string;
  permissions: string[];
  createdAt: number;
  memberCount: number;
};

export async function fetchAuthStatus(): Promise<{ needsSetup: boolean; discordEnabled?: boolean }> {
  const res = await fetch('/api/auth/status', { credentials: 'include' });
  if (!res.ok) return { needsSetup: false };
  return res.json() as Promise<{ needsSetup: boolean; discordEnabled?: boolean }>;
}

export async function checkSession(): Promise<{ authenticated: boolean; user?: PanelUser }> {
  const res = await fetch('/api/auth/session', { credentials: 'include' });
  if (!res.ok) return { authenticated: false };
  return res.json() as Promise<{ authenticated: boolean; user?: PanelUser }>;
}

type AuthResult = { ok: boolean; error?: string; user?: PanelUser; token?: string };

// Browsers that refuse cookies (blocked, Tor, strict privacy modes) still get in: the session token is then held in
// memory only and sent as a Bearer header. It is gone on reload or when the tab closes, and never written to storage.
let memoryToken: string | null = null;
export const isCookieless = (): boolean => memoryToken !== null;
export const cookiesBlocked = (): boolean => typeof navigator !== 'undefined' && navigator.cookieEnabled === false;

export function installSessionHeader(): void {
  const original = window.fetch.bind(window);
  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    if (memoryToken) {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (new URL(url, location.href).origin === location.origin) {
        const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
        if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${memoryToken}`);
        return original(input, { ...init, headers });
      }
    }
    return original(input, init);
  }) as typeof fetch;
}

async function post(path: string, body: unknown, extra: Record<string, string> = {}): Promise<AuthResult> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...extra },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  return res.json() as Promise<AuthResult>;
}

// A sign-in only counts if the browser kept the cookie; otherwise sign in again without one.
async function keepSession(first: AuthResult, password: string, username?: string): Promise<AuthResult> {
  if (!first.ok) return first;
  const session = await checkSession().catch(() => ({ authenticated: false }));
  if (session.authenticated) return first;
  const retry = await post('/api/auth/login', { password, username }, { 'X-Panel-Token': '1' });
  if (retry.ok && retry.token) {
    memoryToken = retry.token;
    return { ok: true, user: retry.user };
  }
  return { ok: false, error: retry.error ?? 'Your browser did not keep the sign-in cookie.' };
}

export async function login(password: string, username?: string): Promise<AuthResult> {
  return keepSession(await post('/api/auth/login', { password, username }), password, username);
}

export async function setupPassword(password: string, username?: string, displayName?: string): Promise<AuthResult> {
  return keepSession(await post('/api/auth/setup', { password, username, displayName }), password, username || 'admin');
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  memoryToken = null;
}

export async function fetchPanelUsers(): Promise<{ users: PanelUser[] } | null> {
  const res = await fetch('/api/panel/users', { credentials: 'include' });
  if (!res.ok) return null;
  return res.json() as Promise<{ users: PanelUser[] }>;
}

export async function createPanelUser(data: {
  username: string;
  password: string;
  displayName?: string;
  role?: 'owner' | 'admin' | 'member';
  groupId?: number | null;
  permissions?: string[];
}): Promise<{ ok: boolean; error?: string; user?: PanelUser; users?: PanelUser[] }> {
  const res = await fetch('/api/panel/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return res.json() as Promise<{ ok: boolean; error?: string; user?: PanelUser; users?: PanelUser[] }>;
}

export async function updatePanelUser(
  id: number,
  data: {
    username?: string;
    password?: string;
    displayName?: string;
    role?: 'owner' | 'admin' | 'member';
    groupId?: number | null;
    permissions?: string[];
  },
): Promise<{ ok: boolean; error?: string; user?: PanelUser; users?: PanelUser[] }> {
  const res = await fetch(`/api/panel/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return res.json() as Promise<{ ok: boolean; error?: string; user?: PanelUser; users?: PanelUser[] }>;
}

export async function transferPanelOwnership(
  id: number,
): Promise<{ ok: boolean; error?: string; users?: PanelUser[] }> {
  const res = await fetch(`/api/panel/users/${id}/owner`, {
    method: 'POST',
    credentials: 'include',
  });
  return res.json() as Promise<{ ok: boolean; error?: string; users?: PanelUser[] }>;
}

export async function deletePanelUser(id: number): Promise<{ ok: boolean; error?: string; users?: PanelUser[] }> {
  const res = await fetch(`/api/panel/users/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return res.json() as Promise<{ ok: boolean; error?: string; users?: PanelUser[] }>;
}

export async function fetchPanelGroups(): Promise<{ groups: PanelGroup[] } | null> {
  const res = await fetch('/api/panel/groups', { credentials: 'include' });
  if (!res.ok) return null;
  return res.json() as Promise<{ groups: PanelGroup[] }>;
}

export async function createPanelGroup(data: {
  name: string;
  description?: string;
  color?: string;
  permissions?: string[];
}): Promise<{ ok: boolean; error?: string; groups?: PanelGroup[] }> {
  const res = await fetch('/api/panel/groups', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return res.json() as Promise<{ ok: boolean; error?: string; groups?: PanelGroup[] }>;
}

export async function updatePanelGroup(
  id: number,
  data: {
    name?: string;
    description?: string;
    color?: string;
    permissions?: string[];
  },
): Promise<{ ok: boolean; error?: string; groups?: PanelGroup[] }> {
  const res = await fetch(`/api/panel/groups/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return res.json() as Promise<{ ok: boolean; error?: string; groups?: PanelGroup[] }>;
}

export async function deletePanelGroup(id: number): Promise<{ ok: boolean; error?: string; groups?: PanelGroup[] }> {
  const res = await fetch(`/api/panel/groups/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return res.json() as Promise<{ ok: boolean; error?: string; groups?: PanelGroup[] }>;
}
