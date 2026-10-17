export async function fetchUsername(client: any, id: unknown): Promise<string> {
  const key = String(id ?? '').trim();
  if (!key) return 'unknown';
  const cached = client?.users?.cache?.get?.(key);
  if (cached?.username) return cached.username;
  try {
    const user = await client?.users?.fetch?.(key);
    if (user?.username) return user.username;
  } catch {
    // deleted or unreachable account
  }
  return 'unknown';
}

export const usernameTag = (name: string) => `\`${name}\``;
