import { ApplicationCommandOptionType, ApplicationIntegrationType, ChannelType, InteractionContextType } from 'discord.js';
import { RegistrationType } from '@tryforge/forgescript';
import type { SlashCommandConfig, SlashOptionConfig } from './slash';

const userOpt = (description: string, required = true): SlashOptionConfig => ({
  type: ApplicationCommandOptionType.User,
  name: 'user',
  description,
  required,
});

const subjectOpt: SlashOptionConfig = {
  type: ApplicationCommandOptionType.String,
  name: 'access',
  description: 'A role name or capability (see /access roles)',
  required: true,
  max_length: 64,
};

// Staff commands are registered in the home server only; the bot checks capabilities on every call.
export const accessCommand: SlashCommandConfig = {
  name: 'access',
  description: 'Manage who can use staff tools (bot staff only)',
  tags: ['admin', 'access', 'permissions'],
  type: RegistrationType.Guild,
  default_member_permissions: null,
  integration_types: [ApplicationIntegrationType.GuildInstall],
  contexts: [InteractionContextType.Guild],
  subcommands: {
    claim: {
      name: 'claim',
      description: 'Claim ownership (application owner only, while no owner exists)',
      tags: ['access'],
    },
    grant: {
      name: 'grant',
      description: 'Give a user a role or capability',
      tags: ['access'],
      options: [
        userOpt('The user to grant access to'),
        subjectOpt,
        { type: ApplicationCommandOptionType.Integer, name: 'hours', description: 'Hours until it expires (empty for never)', required: false, min_value: 1, max_value: 8760 },
        { type: ApplicationCommandOptionType.String, name: 'reason', description: 'Why', required: false, max_length: 200 },
      ],
    },
    revoke: {
      name: 'revoke',
      description: 'Remove a role or capability from a user',
      tags: ['access'],
      options: [userOpt('The user to remove access from'), subjectOpt],
    },
    list: {
      name: 'list',
      description: "Show a user's grants",
      tags: ['access'],
      options: [userOpt('The user to inspect')],
    },
    roles: {
      name: 'roles',
      description: 'Show the roles and the available capabilities',
      tags: ['access'],
    },
    role: {
      name: 'role',
      description: 'Create or replace a role from a list of capabilities',
      tags: ['access'],
      options: [
        { type: ApplicationCommandOptionType.String, name: 'name', description: 'Lowercase role name', required: true, min_length: 2, max_length: 32 },
        { type: ApplicationCommandOptionType.String, name: 'capabilities', description: 'Comma separated capabilities', required: true, max_length: 300 },
      ],
    },
    roledelete: {
      name: 'roledelete',
      description: 'Delete a role and every grant of it',
      tags: ['access'],
      options: [{ type: ApplicationCommandOptionType.String, name: 'name', description: 'The role name', required: true, max_length: 32 }],
    },
    evalchannel: {
      name: 'evalchannel',
      description: 'Restrict eval to one channel (owner only; empty to clear)',
      tags: ['access'],
      options: [
        { type: ApplicationCommandOptionType.Channel, name: 'channel', description: 'The eval channel', required: false, channel_types: [ChannelType.GuildText] },
      ],
    },
    audit: {
      name: 'audit',
      description: 'Show recent access changes and eval runs',
      tags: ['access'],
    },
  },
};
