export const admin = {
  shell: 'bg-[var(--admin-shell-bg,var(--admin-shell))]',
  sidebar: 'bg-[var(--admin-sidebar)] border-[var(--admin-border)]',
  panel: 'bg-[var(--admin-panel)] border-[var(--admin-border)]',
  card: 'bg-[var(--admin-card)] border-[var(--admin-border)]',
  elevated: 'bg-[var(--admin-elevated)] border-[var(--admin-border)]',
  fg: 'text-[var(--admin-fg)]',
  muted: 'text-[var(--admin-muted)]',
  accent: 'bg-[var(--admin-accent)] text-[var(--admin-accent-fg)]',
  accentPill: 'bg-[var(--admin-accent)] text-[var(--admin-accent-fg)]',
  hoverRow: 'hover:bg-[color-mix(in_srgb,var(--admin-fg)_5%,transparent)]',
  input: 'bg-[var(--admin-elevated)] border-[var(--admin-border)] text-[var(--admin-fg)]',
} as const;
