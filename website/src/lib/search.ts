import type { CollectibleEntry, GuildConfigEntry, NationInstanceEntry, RegimeCardItem, UserEntry } from '@/lib/api';
import { getCache } from '@/lib/api';
import type { PanelUser } from '@/lib/auth';
import { bot, formatRarity } from '@/lib/bot';

type AdminSection =
  'dashboard' | 'users' | 'nations' | 'instances' | 'guilds' | 'cards' | 'bot_settings' | 'panel_users' | 'settings';

type SearchResultType = 'page' | 'setting' | 'user' | 'nation' | 'instance' | 'guild' | 'card' | 'staff';

export type SearchResult = {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  section: AdminSection;
  filterQuery?: string;
  score?: number;
};

type StaticIndexItem = {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle: string;
  section: AdminSection;
  filterQuery?: string;
  keywords: string[];
};

export const searchTypeLabels: Record<SearchResultType, string> = {
  page: 'Page',
  setting: 'Setting',
  user: 'User',
  nation: bot.collectible.singular.charAt(0).toUpperCase() + bot.collectible.singular.slice(1),
  instance: 'Instance',
  guild: 'Guild',
  card: 'Card',
  staff: 'Staff',
};

const defaultPages: SearchResult[] = [
  {
    id: 'page-dashboard',
    type: 'page',
    title: 'Dashboard',
    subtitle: 'Stats, charts, metrics and bot activity',
    section: 'dashboard',
  },
  {
    id: 'page-users',
    type: 'page',
    title: 'Users',
    subtitle: 'Player balances, inventories, and gifts',
    section: 'users',
  },
  {
    id: 'page-nations',
    type: 'page',
    title: bot.collectible.plural.charAt(0).toUpperCase() + bot.collectible.plural.slice(1),
    subtitle: 'Global catalog, rarities, and spawn weights',
    section: 'nations',
  },
  {
    id: 'page-instances',
    type: 'page',
    title: 'Nation Instances',
    subtitle: 'List of all caught nation instances and serials',
    section: 'instances',
  },
  {
    id: 'page-guilds',
    type: 'page',
    title: 'Guild Configs',
    subtitle: 'Registered guild spawn channels and drop timers',
    section: 'guilds',
  },
  {
    id: 'page-cards',
    type: 'page',
    title: 'Cards',
    subtitle: 'Regimes, special event cards, and artwork',
    section: 'cards',
  },
  {
    id: 'page-bot-settings',
    type: 'page',
    title: 'Bot Settings',
    subtitle: 'Configuration parameters, prefix, and dynamic flags',
    section: 'bot_settings',
  },
  {
    id: 'page-panel-users',
    type: 'page',
    title: 'Panel Users',
    subtitle: 'Staff accounts, roles, and administrative permissions',
    section: 'panel_users',
  },
  {
    id: 'page-settings',
    type: 'page',
    title: 'Panel Settings',
    subtitle: 'Theme presets, custom palette, and animations',
    section: 'settings',
  },
];

const staticItems: StaticIndexItem[] = [
  {
    id: 'page-dashboard',
    type: 'page',
    title: 'Dashboard',
    subtitle: 'Stats, charts, metrics and bot activity',
    section: 'dashboard',
    keywords: [
      'stats',
      'statistics',
      'charts',
      'analytics',
      'overview',
      'summary',
      'metrics',
      'activity',
      'graph',
      'server count',
      'user count',
      'catches',
      'home',
    ],
  },
  {
    id: 'page-users',
    type: 'page',
    title: 'Users',
    subtitle: 'Player balances, inventories, and gifts',
    section: 'users',
    keywords: [
      'players',
      'accounts',
      'discord id',
      'money',
      'cash',
      'balance',
      'economy',
      'wealth',
      'inventory',
      'privacy',
      'gifts',
      'trades',
      'auctions',
      'user list',
    ],
  },
  {
    id: 'page-nations',
    type: 'page',
    title: bot.collectible.plural.charAt(0).toUpperCase() + bot.collectible.plural.slice(1),
    subtitle: 'Global catalog, rarities, and spawn weights',
    section: 'nations',
    keywords: [
      'catalog',
      'collectibles',
      'balls',
      'countries',
      'nations',
      'rarity',
      'common',
      'uncommon',
      'rare',
      'mystic',
      'legendary',
      'hp',
      'health',
      'attack',
      'combat',
      'weight',
      'art',
    ],
  },
  {
    id: 'page-instances',
    type: 'page',
    title: 'Nation Instances',
    subtitle: 'List of all caught nation instances and serials',
    section: 'instances',
    keywords: ['instances', 'caught', 'catches', 'serials', 'inventory items', 'duplicates', 'history', 'instance id'],
  },
  {
    id: 'page-guilds',
    type: 'page',
    title: 'Guild Configs',
    subtitle: 'Registered guild spawn channels and drop timers',
    section: 'guilds',
    keywords: [
      'servers',
      'guilds',
      'discord servers',
      'spawn',
      'channels',
      'drop rate',
      'drop interval',
      'spawn channel',
      'guild id',
      'prefixes',
    ],
  },
  {
    id: 'page-cards',
    type: 'page',
    title: 'Cards',
    subtitle: 'Regimes, special event cards, and artwork',
    section: 'cards',
    keywords: [
      'cards',
      'regimes',
      'specials',
      'frames',
      'artwork',
      'backgrounds',
      'card designs',
      'borders',
      'events',
      'assets',
    ],
  },
  {
    id: 'page-bot-settings',
    type: 'page',
    title: 'Bot Settings',
    subtitle: 'Configuration parameters, prefix, and dynamic flags',
    section: 'bot_settings',
    keywords: [
      'config',
      'configuration',
      'bot configuration',
      'prefix',
      'parameters',
      'cooldown',
      'drop timer',
      'flags',
      'maintainers',
      'raw json',
      'bot name',
      'currency name',
    ],
  },
  {
    id: 'page-panel-users',
    type: 'page',
    title: 'Panel Users',
    subtitle: 'Staff accounts, roles, and administrative permissions',
    section: 'panel_users',
    keywords: [
      'staff',
      'admins',
      'moderators',
      'roles',
      'permissions',
      'groups',
      'divisions',
      'access control',
      'panel users',
      'security',
      'owner',
      'member',
    ],
  },
  {
    id: 'page-settings',
    type: 'page',
    title: 'Panel Settings',
    subtitle: 'Theme presets, custom palette, and animations',
    section: 'settings',
    keywords: [
      'settings',
      'preferences',
      'theme',
      'appearance',
      'motion',
      'animations',
      'display',
      'ui',
      'performance',
    ],
  },
  {
    id: 'setting-theme',
    type: 'setting',
    title: 'Theme Presets',
    subtitle: 'Panel Settings > Obsidian, Charcoal, Slate, Emerald, Violet, Rose',
    section: 'settings',
    keywords: [
      'dark mode',
      'light mode',
      'theme',
      'appearance',
      'obsidian',
      'charcoal',
      'slate',
      'emerald',
      'violet',
      'rose',
      'colors',
      'styling',
    ],
  },
  {
    id: 'setting-palette',
    type: 'setting',
    title: 'Custom Palette & Accent Color',
    subtitle: 'Panel Settings > Customize backgrounds, surfaces, and accent hex codes',
    section: 'settings',
    keywords: ['custom palette', 'accent color', 'custom colors', 'hex', 'color picker', 'theme color', 'tint'],
  },
  {
    id: 'setting-motion',
    type: 'setting',
    title: 'Motion & Effects',
    subtitle: 'Panel Settings > Fade transitions, 3D card tilt, springs, and hover feedback',
    section: 'settings',
    keywords: [
      'animations',
      'motion',
      'effects',
      'fade',
      'smooth',
      'page transitions',
      'springs',
      'hover feedback',
      'card tilt',
      'tilt',
    ],
  },
  {
    id: 'setting-low-spec',
    type: 'setting',
    title: 'Low-Spec Mode',
    subtitle: 'Panel Settings > Optimize performance and minimize animations',
    section: 'settings',
    keywords: [
      'low spec',
      'performance',
      'lag',
      'fps',
      'boost',
      'battery',
      'slow',
      'hardware acceleration',
      'reduce motion',
      'fast',
    ],
  },
  {
    id: 'setting-economy',
    type: 'setting',
    title: 'Currency & Economy Parameters',
    subtitle: 'Bot Settings > Currency naming, wallet limits, and economy values',
    section: 'bot_settings',
    keywords: ['economy', 'currency', 'money', 'cash', 'coins', 'wallet', 'rewards', 'payouts', 'balance'],
  },
  {
    id: 'setting-spawns',
    type: 'setting',
    title: 'Spawn Timers & Channels',
    subtitle: 'Guild Configs > Server drop intervals and active spawn channels',
    section: 'guilds',
    keywords: [
      'spawn timers',
      'drop intervals',
      'channel drops',
      'cooldowns',
      'spawn rate',
      'intervals',
      'drop frequency',
    ],
  },
  {
    id: 'setting-staff-roles',
    type: 'setting',
    title: 'Staff Roles & Permissions',
    subtitle: 'Panel Users > Configure owner, admin, and member privileges',
    section: 'panel_users',
    keywords: [
      'staff roles',
      'permissions',
      'admin privileges',
      'owner access',
      'member permissions',
      'authorization',
      'security',
    ],
  },
  {
    id: 'setting-user-privacy',
    type: 'setting',
    title: 'User Privacy & Gift Filters',
    subtitle: 'Users > Public or private inventories and gift permissions',
    section: 'users',
    keywords: [
      'user privacy',
      'public inventory',
      'private inventory',
      'accept gifts',
      'block gifts',
      'trading settings',
    ],
  },
];

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const row = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) row[j] = j;

  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    for (let j = 1; j <= b.length; j++) {
      let val = prev;
      if (a[i - 1] === b[j - 1]) {
        val = row[j - 1];
      } else {
        val = Math.min(row[j - 1] + 1, prev + 1, row[j] + 1);
      }
      row[j - 1] = prev;
      prev = val;
    }
    row[b.length] = prev;
  }
  return row[b.length];
}

function tokenFuzzyMatches(word: string, token: string): boolean {
  if (word.startsWith(token) || token.startsWith(word)) return true;
  if (word.includes(token)) return true;
  if (token.length < 3) return false;
  const maxDistance = token.length <= 4 ? 1 : 2;
  if (Math.abs(word.length - token.length) > maxDistance) return false;
  return levenshtein(word, token) <= maxDistance;
}

function calculateScore(title: string, subtitle: string, keywords: string[], query: string): number {
  const q = query.toLowerCase().trim();
  const t = title.toLowerCase();
  const s = subtitle.toLowerCase();

  if (t === q) return 100;
  if (t.startsWith(q)) return 85;

  const titleWords = t.split(/[\s\-_,.:;/|\\()+]+/).filter(Boolean);
  if (titleWords.some((w) => w === q)) return 80;
  if (t.includes(q)) return 70;

  for (const kw of keywords) {
    const k = kw.toLowerCase();
    if (k === q) return 65;
    if (k.startsWith(q)) return 55;
    if (k.includes(q)) return 45;
  }

  if (s.includes(q)) return 35;

  const qTokens = q.split(/[\s\-_,.:;/|\\()+]+/).filter(Boolean);
  if (qTokens.length > 0) {
    const titleFuzzy = qTokens.every((token) => titleWords.some((w) => tokenFuzzyMatches(w, token)));
    if (titleFuzzy) return 30;

    const kwFuzzy = qTokens.every((token) =>
      keywords.some((kw) => {
        const kwWords = kw
          .toLowerCase()
          .split(/[\s\-_,.:;/|\\()+]+/)
          .filter(Boolean);
        return kwWords.some((w) => tokenFuzzyMatches(w, token));
      }),
    );
    if (kwFuzzy) return 25;

    const subWords = s.split(/[\s\-_,.:;/|\\()+]+/).filter(Boolean);
    const subFuzzy = qTokens.every((token) => subWords.some((w) => tokenFuzzyMatches(w, token)));
    if (subFuzzy) return 15;
  }

  return 0;
}

function getCachedPanelUsers(): PanelUser[] {
  const fromCache = getCache<{ users: PanelUser[] }>('panel_users');
  if (fromCache?.users && Array.isArray(fromCache.users)) return fromCache.users;
  return [];
}

export function searchAdmin(
  rawQuery: string,
  dynamicUsers?: UserEntry[],
  dynamicCatalog?: CollectibleEntry[],
): SearchResult[] {
  const query = rawQuery.trim();
  if (!query) return defaultPages;

  const scoredResults: SearchResult[] = [];

  for (const item of staticItems) {
    const score = calculateScore(item.title, item.subtitle, item.keywords, query);
    if (score > 0) {
      scoredResults.push({
        id: item.id,
        type: item.type,
        title: item.title,
        subtitle: item.subtitle,
        section: item.section,
        filterQuery: item.filterQuery,
        score,
      });
    }
  }

  const usersList = dynamicUsers && dynamicUsers.length > 0 ? dynamicUsers : (getCache<UserEntry[]>('users_all') ?? []);

  for (const user of usersList) {
    const keywords = [
      user.discordId,
      user.username,
      user.inventoryPrivacy,
      user.acceptGifts ? 'gifts enabled' : 'gifts disabled',
      'user',
      'player',
    ];
    const score = calculateScore(user.username, user.discordId, keywords, query);
    if (score > 0) {
      scoredResults.push({
        id: `user-${user.discordId}`,
        type: 'user',
        title: user.username,
        subtitle: `${user.discordId} | Value: ${user.totalValue.toLocaleString()}`,
        section: 'users',
        filterQuery: user.username,
        score,
      });
    }
  }

  const catalogList =
    dynamicCatalog && dynamicCatalog.length > 0
      ? dynamicCatalog
      : (getCache<CollectibleEntry[]>('collectibles_all') ?? []);

  for (const entry of catalogList) {
    const rarityLabel = formatRarity(entry.class);
    const keywords = [entry.name, entry.id, entry.class, rarityLabel, 'nation', 'collectible'];
    const score = calculateScore(entry.name, `${entry.id} | ${rarityLabel}`, keywords, query);
    if (score > 0) {
      scoredResults.push({
        id: `nation-${entry.id}`,
        type: 'nation',
        title: entry.name,
        subtitle: `${entry.id} | ${rarityLabel} | Weight: ${entry.weight}`,
        section: 'nations',
        filterQuery: entry.name,
        score,
      });
    }
  }

  const instances =
    getCache<NationInstanceEntry[]>('instances_all_v2') ?? getCache<NationInstanceEntry[]>('instances_all') ?? [];

  for (const inst of instances) {
    const title = inst.name || inst.id;
    const rarityLabel = formatRarity(inst.class);
    const subtitle = `#${inst.id} | ${rarityLabel} | Owner: ${inst.player || 'None'}`;
    const keywords = [inst.id, inst.name || '', inst.class, rarityLabel, inst.player || '', 'instance'];
    const score = calculateScore(title, subtitle, keywords, query);
    if (score > 0) {
      scoredResults.push({
        id: `instance-${inst.id}`,
        type: 'instance',
        title,
        subtitle,
        section: 'instances',
        filterQuery: inst.id,
        score,
      });
    }
  }

  const guilds = getCache<GuildConfigEntry[]>('guilds_all') ?? [];
  for (const guild of guilds) {
    const title = `Guild ${guild.guildId}`;
    const defaultPrefix = bot.prefixes[0] || '';
    const subtitle = `Channel: ${guild.spawnChannel || 'None'} | Status: ${guild.status || (guild.enabled ? 'Enabled' : 'Disabled')}`;
    const keywords = [guild.guildId, guild.spawnChannel || '', defaultPrefix, 'server', 'guild'];
    const score = calculateScore(title, subtitle, keywords, query);
    if (score > 0) {
      scoredResults.push({
        id: `guild-${guild.guildId}`,
        type: 'guild',
        title,
        subtitle,
        section: 'guilds',
        filterQuery: guild.guildId,
        score,
      });
    }
  }

  const cards = getCache<RegimeCardItem[]>('cards_regimes_cache') ?? [];
  for (const card of cards) {
    const title = card.name || card.id || 'Regime Card';
    const subtitle = `Card Regime | ${card.file || 'Asset'}`;
    const keywords = [card.name || '', card.id || '', card.file || '', 'regime', 'card'];
    const score = calculateScore(title, subtitle, keywords, query);
    if (score > 0) {
      scoredResults.push({
        id: `card-${card.id || card.name}`,
        type: 'card',
        title,
        subtitle,
        section: 'cards',
        filterQuery: card.name || card.id || '',
        score,
      });
    }
  }

  const panelUsers = getCachedPanelUsers();
  for (const pUser of panelUsers) {
    const title = pUser.displayName || pUser.username;
    const subtitle = `@${pUser.username} | Role: ${pUser.role}${pUser.groupName ? ` (${pUser.groupName})` : ''}`;
    const keywords = [
      pUser.username,
      pUser.displayName || '',
      pUser.role,
      pUser.groupName || '',
      'staff',
      'panel user',
    ];
    const score = calculateScore(title, subtitle, keywords, query);
    if (score > 0) {
      scoredResults.push({
        id: `staff-${pUser.id}`,
        type: 'staff',
        title,
        subtitle,
        section: 'panel_users',
        filterQuery: pUser.username,
        score,
      });
    }
  }

  scoredResults.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  const seenIds = new Set<string>();
  const uniqueResults: SearchResult[] = [];
  for (const item of scoredResults) {
    if (!seenIds.has(item.id)) {
      seenIds.add(item.id);
      uniqueResults.push(item);
    }
    if (uniqueResults.length >= 20) break;
  }

  return uniqueResults;
}
