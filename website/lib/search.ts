import {
  bot,
  formatRarity,
  placeholderCatalog,
  placeholderLogs,
  placeholderUsers,
} from '@/lib/bot';

export type AdminSection = 'dashboard' | 'users' | 'nations' | 'cards' | 'settings';

export type SearchResultType = 'page' | 'user' | 'nation' | 'log';

export type SearchResult = {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  section: AdminSection;
  /** Applied as the page-local search filter after navigation */
  filterQuery?: string;
};

const pages: SearchResult[] = [
  {
    id: 'page-dashboard',
    type: 'page',
    title: 'Dashboard',
    subtitle: 'Stats, charts, activity logs',
    section: 'dashboard',
  },
  {
    id: 'page-users',
    type: 'page',
    title: 'Users',
    subtitle: 'Player inventories',
    section: 'users',
  },
  {
    id: 'page-nations',
    type: 'page',
    title: bot.collectible.plural.charAt(0).toUpperCase() + bot.collectible.plural.slice(1),
    subtitle: 'Global catalog',
    section: 'nations',
  },
  {
    id: 'page-cards',
    type: 'page',
    title: 'Cards',
    subtitle: 'Regimes, specials, and card assets',
    section: 'cards',
  },
  {
    id: 'page-settings',
    type: 'page',
    title: 'Settings',
    subtitle: 'Theme, animations, and display preferences',
    section: 'settings',
  },
];

function matchesQuery(text: string, query: string) {
  return text.toLowerCase().includes(query.toLowerCase());
}

export function searchAdmin(rawQuery: string): SearchResult[] {
  const query = rawQuery.trim();
  if (!query) return pages;

  const results: SearchResult[] = [];

  for (const page of pages) {
    if (matchesQuery(page.title, query) || matchesQuery(page.subtitle ?? '', query)) {
      results.push(page);
    }
  }

  for (const user of placeholderUsers) {
    if (matchesQuery(user.username, query) || matchesQuery(user.discordId, query)) {
      results.push({
        id: `user-${user.discordId}`,
        type: 'user',
        title: user.username,
        subtitle: user.discordId,
        section: 'users',
        filterQuery: user.username,
      });
    }
  }

  for (const entry of placeholderCatalog) {
    if (matchesQuery(entry.name, query) || matchesQuery(entry.id, query)) {
      results.push({
        id: `nation-${entry.id}`,
        type: 'nation',
        title: entry.name,
        subtitle: `${entry.id} · ${formatRarity(entry.class)}`,
        section: 'nations',
        filterQuery: entry.name,
      });
    }
  }

  for (const log of placeholderLogs) {
    if (matchesQuery(log.message, query) || matchesQuery(log.topic, query)) {
      results.push({
        id: `log-${log.id}`,
        type: 'log',
        title: log.message,
        subtitle: `${log.topic} · ${log.level}`,
        section: 'dashboard',
        filterQuery: query,
      });
    }
  }

  return results;
}

export const searchTypeLabels: Record<SearchResultType, string> = {
  page: 'Page',
  user: 'User',
  nation: bot.collectible.singular.charAt(0).toUpperCase() + bot.collectible.singular.slice(1),
  log: 'Log',
};
