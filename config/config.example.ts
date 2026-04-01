export const config = {
  token: '',
  description: 'Collect nations on Discord and enjoy an OG environment of peace and freedom!',
  prefix: '!',
  name: 'Nationdex',
  status: 'online',
  activity: {
    name: 'wild nations appear!',
    type: 'Watching',
  },

  repoURL: 'https://github.com/Nationdex-Team/Nationdex-OG',
  serverURL: 'https://discord.gg/tKh3n5uVnm',
  ToS: 'https://arielaram.com/terms-of-service',
  PrivacyPolicy: 'https://arielaram.com/privacy-policy',

  spawn: {
    rateRange: { min: 30, max: 45 },
    spawnMessages: [
      { message: 'A wild nation has appeared!', rarity: '10' },
      { message: 'A wild nation has spawned!', rarity: '8' },
      { message: 'A nation has appeared!', rarity: '6' },
      { message: 'A wild nation came in!', rarity: '4' },
      { message: 'A nation has spawned, think fast mister!', rarity: '3' },
    ],
    catchButtons: [
      { message: 'Catch me!', rarity: '8' },
      { message: 'Catch this nation!', rarity: '4' },
    ],
    wrongName: [
      { message: 'Wrong name!', rarity: '10' },
      { message: 'Lol one more time xD!1!1!', rarity: '3' },
    ],
    successfulCatch: [
      { message: 'Horray! You caught {name}!', rarity: '10' },
      { message: 'Great job! You caught {name}!', rarity: '8' },
      { message: 'Wow! You caught {name}!', rarity: '6' },
    ],
    catchBonus: { min: -50, max: 50 },
    cooldown: 600,
  },

  macroServers: [''],
  macroUsers: [''],

  logChannel: '',

  appearance: {
    interface: {
      collectible: { singular: 'nation', plural: 'nations' },
      health: { name: 'Health', unit: 'hp' },
      attack: { name: 'Attack', unit: 'atk' },
    },
    commands: {
      collectibles: 'nations',
      admin: 'macro',
      comp: {
        name: 'comp',
        desc: 'Shows the amount of nations collected and the progress of your journey.',
      },
      list: {
        name: 'list',
        desc: 'Shows a list of all the nations you have collected.',
      },
      show: { name: 'show', desc: 'Shows the nation you caught.' },
      give: { name: 'give', desc: 'Gives a nation to a user.' },
    },
  },
};
