import { ApplicationCommand } from '@tryforge/forgescript';
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ApplicationIntegrationType,
} from 'discord.js';

export default new ApplicationCommand({
  data: {
    type: ApplicationCommandType.ChatInput,
    name: 'channel',
    description: 'Set a channel for nations to spawn.',
    integration_types: [ApplicationIntegrationType.GuildInstall],
    options: [
      {
        type: ApplicationCommandOptionType.Channel,
        name: 'channel',
        description: 'The channel to spawn nations in. Leave empty to reset.',
        required: false,
        channel_types: [0],
      },
    ],
  },
  code: `
  $onlyIf[$hasPerms[$guildID;$authorID;ManageGuild];
    $err[You need **Manage Server** permissions to use this command.;true]
  ]
  
  $let[ch;$option[channel]]
  $jsonLoad[config;$getGuildVar[spawnConfig]]
  $!jsonSet[config;config_channel;"$get[ch]"]
  $setGuildVar[spawnConfig;$env[config]]
  

  $interactionReply[
    $ephemeral
    $addContainer[
      $addTextDisplay[$if[$get[ch]==;Removed the spawn channel. Nations will now spawn in the most active channel of the server.;Nations will now spawn in <#$get[ch]>]]
    ;#00FF00]
  ]
  `,
});
