/**
 * Placeholder mirror of `src/config` + `src/config/variables.json`.
 * Replace with live ForgeDB reads when the admin API is wired up.
 */
export const bot = {
  name: 'Nationdex',
  version: '1.0.0',
  description:
    'Collect nations on Discord and enjoy the OG environment through one of the oldest Ballsdex-like bots in existence!',
  collectible: {
    singular: 'nation',
    plural: 'nations',
  },
  prefixes: ['nd!', 'nd.'],
  color: '#003297ff',
  rarityClasses: ['common', 'uncommon', 'rare', 'mythic', 'legendary'] as const,
  vars: {
    userInventory: 'nations',
    globalCatalog: 'nationsData',
    caughtInstance: 'nation',
    spawnConfig: 'spawnConfig',
    settings: 'settings',
    blockedUsers: 'blockedUsers',
    auctionHouse: 'auctionHouse',
    specials: 'specials',
  },
  userFields: [
    'total',
    'total_value',
    'unique',
    'nations',
    'common',
    'uncommon',
    'rare',
    'mythic',
    'legendary',
  ] as const,
  settingsFields: ['inventory_privacy', 'profile_privacy', 'accept_gifts'] as const,
  slashGroups: ['nations', 'player', 'spawn', 'rarity', 'info'] as const,
} as const;

export type RarityClass = (typeof bot.rarityClasses)[number];

export const rarityLabels: Record<RarityClass, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  mythic: 'Mythic',
  legendary: 'Legendary',
};

export const rarityBadgeClass: Record<RarityClass, string> = {
  common: 'bg-gray-500/20 text-gray-400',
  uncommon: 'bg-green-500/20 text-green-400',
  rare: 'bg-blue-500/20 text-blue-400',
  mythic: 'bg-purple-500/20 text-purple-400',
  legendary: 'bg-yellow-500/20 text-yellow-400',
};

/** Mock `nationsData` global catalog entries */
export const placeholderCatalog = [
  {
    id: 'US',
    name: 'United States',
    class: 'common' as RarityClass,
    globalCaught: 1245,
    weight: 10,
  },
  { id: 'JP', name: 'Japan', class: 'common' as RarityClass, globalCaught: 892, weight: 10 },
  { id: 'DE', name: 'Germany', class: 'common' as RarityClass, globalCaught: 756, weight: 10 },
  { id: 'MC', name: 'Monaco', class: 'rare' as RarityClass, globalCaught: 34, weight: 50 },
  {
    id: 'VA',
    name: 'Vatican City',
    class: 'legendary' as RarityClass,
    globalCaught: 5,
    weight: 200,
  },
  {
    id: 'LI',
    name: 'Liechtenstein',
    class: 'mythic' as RarityClass,
    globalCaught: 18,
    weight: 100,
  },
] as const;

/** Mock user rows from `getUserVar[nations]` */
export const placeholderUsers = [
  {
    discordId: '123456789012345678',
    username: 'player_one',
    total: 12,
    unique: 8,
    totalValue: 420,
    inventoryPrivacy: 'public',
    acceptGifts: true,
    caughtAt: '2024-08-01',
  },
  {
    discordId: '234567890123456789',
    username: 'nation_hunter',
    total: 45,
    unique: 31,
    totalValue: 1890,
    inventoryPrivacy: 'public',
    acceptGifts: true,
    caughtAt: '2024-07-15',
  },
  {
    discordId: '345678901234567890',
    username: 'collector99',
    total: 8,
    unique: 6,
    totalValue: 210,
    inventoryPrivacy: 'private',
    acceptGifts: false,
    caughtAt: '2024-08-10',
  },
] as const;

/** Mock dashboard totals (mirrors `/info about` + nationsData) */
export const placeholderStats = {
  userCount: 1234,
  guildCount: 42,
  catalogTotal: 195,
  totalCaught: 45678,
} as const;

export const placeholderLogs = [
  {
    id: '1',
    topic: 'Users' as const,
    timestamp: '2024-08-17T01:01:00Z',
    level: 'info' as const,
    message: 'getUserVar[nations] initialized for new player_one',
  },
  {
    id: '2',
    topic: 'Nations' as const,
    timestamp: '2024-08-17T00:45:00Z',
    level: 'info' as const,
    message: 'addUserNation: United States caught by player_one (#A1B2C3D)',
  },
  {
    id: '3',
    topic: 'Servers' as const,
    timestamp: '2024-08-17T00:30:00Z',
    level: 'warn' as const,
    message: 'spawnConfig[status] set to enabled in guild 987654321098765432',
  },
  {
    id: '4',
    topic: 'Activity' as const,
    timestamp: '2024-08-16T23:15:00Z',
    level: 'error' as const,
    message: 'Discord gateway reconnect timed out after 30s',
  },
  {
    id: '5',
    topic: 'Activity' as const,
    timestamp: '2024-08-16T23:00:00Z',
    level: 'info' as const,
    message: 'ForgeClient ready — ForgeDB, ForgeCanvas loaded (dist/index.js)',
  },
  {
    id: '6',
    topic: 'Nations' as const,
    timestamp: '2024-08-16T22:10:00Z',
    level: 'info' as const,
    message: 'transferUserNation: gift sent to nation_hunter (#X9Y8Z7W)',
  },
] as const;

export type LogTopic = (typeof placeholderLogs)[number]['topic'];

export function collectibleLabel(count: number): string {
  return count === 1 ? bot.collectible.singular : bot.collectible.plural;
}

export function formatRarity(rarity: RarityClass): string {
  return rarityLabels[rarity];
}

/** Card art types — regime defaults from nation info, specials from global `specials` var */
export const cardCategories = [
  { id: 'regimes', label: 'Regimes', description: 'Default nation card art by government type' },
  { id: 'specials', label: 'Specials', description: 'Override cards from getSpecial[name;card]' },
] as const;

export type CardCategoryId = (typeof cardCategories)[number]['id'];

export const placeholderRegimes = [
  { id: 'democracy', name: 'Democracy', file: 'democracy.png', nationsCount: 68 },
  { id: 'republic', name: 'Republic', file: 'republic.png', nationsCount: 42 },
  { id: 'monarchy', name: 'Monarchy', file: 'monarchy.png', nationsCount: 31 },
  { id: 'dictatorship', name: 'Dictatorship', file: 'dictatorship.png', nationsCount: 18 },
  { id: 'theocracy', name: 'Theocracy', file: 'theocracy.png', nationsCount: 6 },
] as const;

export const placeholderSpecials = [
  {
    id: 'golden',
    name: 'Golden',
    card: 'golden.png',
    description: 'Rare golden foil variant for events',
  },
  {
    id: 'holographic',
    name: 'Holographic',
    card: 'holographic.png',
    description: 'Shimmer holo overlay',
  },
  {
    id: 'shadow',
    name: 'Shadow',
    card: 'shadow.png',
    description: 'Dark silhouette special spawn',
  },
  {
    id: 'founder',
    name: 'Founder',
    card: 'founder.png',
    description: 'Limited founder edition card',
  },
] as const;
