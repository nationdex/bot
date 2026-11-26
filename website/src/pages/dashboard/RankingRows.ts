type Cell = { text: string; title?: string };
type RankingKind = 'nations' | 'players';

const styles: Record<RankingKind, string[]> = {
  nations: [
    'py-2.5 pl-4 sm:pl-5 pr-4 text-xs text-[var(--admin-muted)]',
    'text-xs sm:text-sm text-[var(--admin-muted)] py-2.5 px-4 font-medium',
    'py-2.5 px-4 text-xs text-[var(--admin-muted)] capitalize',
    'py-2.5 pr-4 sm:pr-5 text-right text-sm text-[var(--admin-fg)]',
  ],
  players: [
    'py-2.5 pl-4 sm:pl-5 pr-4 text-xs font-medium text-[var(--admin-fg)]',
    'py-2.5 px-4 text-right text-xs text-[var(--admin-fg)] tabular-nums font-semibold',
    'py-2.5 px-4 text-right text-xs text-[var(--admin-muted)] tabular-nums',
    'py-2.5 pr-4 sm:pr-5 text-right text-xs text-[var(--admin-muted)] tabular-nums',
  ],
};

const signatures = new WeakMap<HTMLTableSectionElement, string>();

export function updateRankingRows(host: HTMLTableSectionElement, kind: RankingKind, rows: Cell[][], animate: boolean) {
  const signature = JSON.stringify([kind, rows, animate]);
  if (signatures.get(host) === signature) return;
  signatures.set(host, signature);
  host.replaceChildren();
  if (!rows.length) {
    const cell = host.insertRow().insertCell();
    cell.colSpan = 4;
    cell.className = 'py-8 text-center text-sm text-[var(--admin-muted)]';
    cell.textContent = 'No data';
    return;
  }
  rows.forEach((cells, index) => {
    const row = host.insertRow();
    row.className =
      'border-b border-[var(--admin-border)] last:border-0 hover:bg-[var(--admin-elevated)] transition-colors';
    cells.forEach(({ text, title }, column) => {
      const cell = row.insertCell();
      cell.className = styles[kind][column];
      cell.textContent = text;
      if (title) cell.title = title;
    });
    if (animate)
      row.animate(
        [
          { opacity: 0, transform: 'translateX(-12px)' },
          { opacity: 1, transform: 'none' },
        ],
        {
          duration: 200,
          delay: 450 + index * 60,
          fill: 'backwards',
        },
      );
  });
}
