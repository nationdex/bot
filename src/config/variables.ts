const defaultVariables = {
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
      collection_cards: 'assets/collection_cards',
      spawn_arts: 'assets/spawn_arts',
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
    collectibleIds: []
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
};

export const variables = JSON.parse(JSON.stringify(defaultVariables));

export async function syncVariables(client?: any): Promise<void> {
  try {
    const DataBase = client?.db ?? require('@nationdex/db/dist/util').DataBase;
    for (const name of Object.keys(defaultVariables)) {
      const data = await DataBase.get({ name, type: 'custom' }).then((x: any) => x?.value);
      if (data !== null && data !== undefined) {
        const val =
          typeof data === 'string'
            ? (() => {
                try {
                  return JSON.parse(data);
                } catch {
                  return data;
                }
              })()
            : data;

        if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
          (variables as any)[name] = {
            ...(defaultVariables as any)[name],
            ...val,
          };
        } else {
          (variables as any)[name] = val;
        }
      }
    }
  } catch (err) {
    console.error('Failed to synchronize variables from database:', err);
  }
}