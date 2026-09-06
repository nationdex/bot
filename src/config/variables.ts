export const variables = {
  config: {
    bot: {
      name: 'Nationdex',
      description: 'Collect nations on Discord and enjoy an OG environment of peace and freedom!',
      version: '1.0.0',
    },
    urls: {
      repo: 'https://github.com/nationdex/bot',
      server: 'https://discord.gg/tKh3n5uVnm',
      terms: 'https://arielaram.com/terms-of-service',
      policy: 'https://arielaram.com/privacy-policy',
    },
    paths: {
      window_art: 'assets/window_art',
      spawn_art: 'assets/spawn_art',
      icons: 'assets/icons',
      cards: 'assets/cards',
    },
    author: {
      name: 'Ariel Aram',
      profile: 'https://discord.com/users/525421785001361408',
    },
    dev: {
      name: 'Ayansh',
      profile: 'https://discord.com/users/1421877908456083578',
    },
    webDev: {
      name: 'Aditya',
      profile: 'https://discord.com/users/903681538842054686',
    },
    prefix: 'n.',
    logChannel: '',
    accent: '#4000ff'
  },
  keywords: {
    collectible: {
      singular: 'nation',
      plural: 'nations'
    },
    currency: {
      singular: 'foil',
      plural: 'foils'
    }
  },
  balance: 0,
  settings: {
    inventory_privacy: 'public',
    profile_privacy: 'public',
    accept_gifts: 'true'
  },
  collectiblesData: {
    classes: ['common', 'uncommon', 'rare', 'mythic', 'legendary'],
    total: 0,
    common: 0,
    uncommon: 0,
    rare: 0,
    mythic: 0,
    legendary: 0,
    total_caught: 0,
    collectibles: {},
  },
  userCollectibles: {
    total: 0,
    total_value: 0,
    common: 0,
    uncommon: 0,
    rare: 0,
    mythic: 0,
    legendary: 0,
    unique: [],
    collectibleIDs: []
  },
  auctionHouse: {},
  auction: {
    total: 0,
    sold: 0,
    earnings: 0,
    onSale: [],
  },
  collectible: {
    id: '',
    author: '',
    attack: '',
    health: '',
    attack_type: '',
    health_type: '',
    special: '',
    card: '',
    timestamp: '',
    caught_in: ''
  },
  codeInfo: {
    reward: '',
    message: '',
    expires_at: '',
    uses_left: '',
    used_by: [],
  },
  spawnConfig: {
    config_channel: '',
    status: 'enabled',
    weight: 0,
    channel: '',
    message: '',
    id: '',
    attack: '',
    health: '',
    attack_bonus: '',
    health_bonus: '',
    special: '',
    timestamp: '',
    caught_by: '',
    caught_in: ''
  },
  specials: {},
  userStats: {
    catches_total: 0,
    battles_won: 0,
    trades_completed: 0,
    gifts_sent: 0,
  },
};
