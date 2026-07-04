import { ApplicationCommand } from '@tryforge/forgescript';
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ApplicationIntegrationType,
  InteractionContextType,
} from 'discord.js';
import { ctbl } from '../../config/collectible';

export default new ApplicationCommand({
  data: {
    type: ApplicationCommandType.ChatInput,
    name: 'channel',
    description: `Set the channel where ${ctbl.plural} will spawn.`,
    integration_types: [ApplicationIntegrationType.GuildInstall],
    contexts: [InteractionContextType.Guild],
    options: [
      {
        type: ApplicationCommandOptionType.Channel,
        name: 'channel',
        description: `The channel to spawn ${ctbl.plural} in. Leave empty to reset.`,
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
      $addTextDisplay[$if[$get[ch]==;Removed the spawn channel. ${ctbl.plural} will now spawn in the most active channel of the server.;${ctbl.plural} will now spawn in <#$get[ch]>]]
    ;#00FF00]
  ]
  `,
});
