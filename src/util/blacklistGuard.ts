export const GUARD_PREFIX = '$blacklistGuard';

export const GUARDED_EVENTS = new Set<string>(['messageCreate', 'interactionCreate']);

export function withBlacklistGuard(code: string, mode: 'silent' | 'reply'): string {
  if (code.trimStart().startsWith(GUARD_PREFIX)) return code;
  return `${GUARD_PREFIX}[${mode}]\n${code}`;
}
