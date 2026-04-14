/**
 * Nationdex configuration — example
 *
 * Copy this file to config/config.ts and fill in your values.
 * config/config.ts is gitignored and never committed.
 *
 *   cp config/config.example.ts config/config.ts
 */
export const config = {
  // ── Bot credentials ──────────────────────────────────────────────────────
  token: '',

  // ── Identity ─────────────────────────────────────────────────────────────
  name: 'Nationdex',
  description: 'Collect nations on Discord and enjoy an OG environment of peace and freedom!',
  prefix: '!',
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
      prog: {
        name: 'prog',
        desc: 'View your collection progress and select nations to inspect.',
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
