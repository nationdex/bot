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

export async function fetchAuthStatus(): Promise<{ needsSetup: boolean }> {
  const res = await fetch('/api/auth/status', { credentials: 'include' });
  if (!res.ok) return { needsSetup: false };
  return res.json() as Promise<{ needsSetup: boolean }>;
}

export async function checkSession(): Promise<{ authenticated: boolean; user?: PanelUser }> {
  const res = await fetch('/api/auth/session', { credentials: 'include' });
  if (!res.ok) return { authenticated: false };
  return res.json() as Promise<{ authenticated: boolean; user?: PanelUser }>;
}

export async function login(password: string, username?: string): Promise<{ ok: boolean; error?: string; user?: PanelUser }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ password, username }),
  });
  return res.json() as Promise<{ ok: boolean; error?: string; user?: PanelUser }>;
}

export async function setupPassword(password: string, username?: string, displayName?: string): Promise<{ ok: boolean; error?: string; user?: PanelUser }> {
  const res = await fetch('/api/auth/setup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ password, username, displayName }),
  });
  return res.json() as Promise<{ ok: boolean; error?: string; user?: PanelUser }>;
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
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
  }
): Promise<{ ok: boolean; error?: string; user?: PanelUser; users?: PanelUser[] }> {
  const res = await fetch(`/api/panel/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return res.json() as Promise<{ ok: boolean; error?: string; user?: PanelUser; users?: PanelUser[] }>;
}

export async function transferPanelOwnership(id: number): Promise<{ ok: boolean; error?: string; users?: PanelUser[] }> {
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
  }
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