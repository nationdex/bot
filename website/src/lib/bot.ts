export const bot = {
  name: 'Nationdex',
  description:
    'Collect nations on Discord and enjoy the OG environment through one of the oldest Ballsdex-like bots in existence!',
  collectible: {
    singular: 'nation',
    plural: 'nations',
  },
  prefixes: ['n.'],
  color: '#003297ff',
  rarityClasses: ['common', 'uncommon', 'rare', 'mythic', 'legendary'] as const,
  vars: {
    userInventory: 'nations',
    globalCatalog: 'nationsData',
    caughtInstance: 'nation',
    spawnConfig: 'spawnConfig',
    settings: 'settings',
    auctionHouse: 'auctionHouse',
    specials: 'specials',
  },
} as const;

export type RarityClass = (typeof bot.rarityClasses)[number];

const rarityLabels: Record<RarityClass, string> = {
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

export function collectibleLabel(count: number): string {
  return count === 1 ? bot.collectible.singular : bot.collectible.plural;
}

export function formatRarity(rarity: RarityClass): string {
  return rarityLabels[rarity];
}

export const cardCategories = [
  { id: 'regimes', label: 'Regimes', description: '' },
  { id: 'specials', label: 'Specials', description: '' },
] as const;

export type CardCategoryId = (typeof cardCategories)[number]['id'];
