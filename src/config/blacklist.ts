import { ApplicationCommandOptionType } from 'discord.js';
import type { SlashOptionConfig, SlashSubcommandGroupConfig } from './slash';

const userOpt: SlashOptionConfig = {
  type: ApplicationCommandOptionType.User,
  name: 'user',
  description: 'The user (use this or guild_id)',
  required: false,
};

const guildOpt: SlashOptionConfig = {
  type: ApplicationCommandOptionType.String,
  name: 'guild_id',
  description: 'The server id (use this or user)',
  required: false,
  min_length: 15,
  max_length: 25,
};

const reasonOpt = (required: boolean): SlashOptionConfig => ({
  type: ApplicationCommandOptionType.String,
  name: 'reason',
  description: 'The reason',
  required,
  max_length: 500,
});

const blacklistGroup: SlashSubcommandGroupConfig = {
  name: 'blacklist',
  description: 'Manage the user and server blacklist (bot staff only)',
  subcommands: {
    add: {
      name: 'add',
      description: 'Blacklist a user or a server',
      tags: ['admin', 'blacklist'],
      // Discord requires required options first.
      options: [reasonOpt(true), userOpt, guildOpt],
    },
    remove: {
      name: 'remove',
      description: 'Remove a user or a server from the blacklist',
      tags: ['admin', 'blacklist'],
      options: [userOpt, guildOpt, reasonOpt(false)],
    },
    view: {
      name: 'view',
      description: 'Browse the blacklist, or open the details and history of one target',
      tags: ['admin', 'blacklist'],
      options: [userOpt, guildOpt],
    },
  },
};

export const blacklistGroups = { blacklist: blacklistGroup };
