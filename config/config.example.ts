/**
 * Nationdex configuration
 */
export const config = {
  // ── Bot credentials ──────────────────────────────────────────────────────
  token: '',

  // ── Identity ─────────────────────────────────────────────────────────────
  name: 'Nationdex',
  description: 'Collect nations on Discord and enjoy an OG environment of peace and freedom!',
  prefix: 'n.',
  status: 'online',
  activity: {
    name: 'wild nations appear!',
    type: 'Watching',
  },

  // ── Links ─────────────────────────────────────────────────────────────────
  repoURL: 'https://github.com/Nationdex-Team/Nationdex',
  serverURL: 'https://discord.gg/tKh3n5uVnm',
  ToS: 'https://arielaram.com/terms-of-service',
  PrivacyPolicy: 'https://arielaram.com/privacy-policy',

  // ── Logging ───────────────────────────────────────────────────────────────
  /** Discord channel ID where admin log messages are sent. */
  logChannel: '',

  // ── Appearance ────────────────────────────────────────────────────────────
  appearance: {
    interface: {
      collectible: { singular: 'nation', plural: 'nations' },
    },
    commands: {
      collectibles: 'nations',
      comp: {
        name: 'comp',
        desc: 'Shows the amount of ${collectiblePlural} collected and the progress of your journey.',
      },
      list: {
        name: 'list',
        desc: 'Shows a list of all the ${collectiblePlural} you have collected.',
      },
    },
  },

  // ── Packages ──────────────────────────────────────────────────────────────
  packages: [
    'nationdex.packages.info',
    'nationdex.packages.nations',
    'nationdex.packages.promocodes',
  ] as string[],
};
