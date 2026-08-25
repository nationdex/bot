import { ApplicationCommand } from '@tryforge/forgescript';
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ApplicationIntegrationType,
  InteractionContextType,
  ChannelType,
} from 'discord.js';
import { variables } from '../../config/variables';

export default new ApplicationCommand({
  data: {
    type: ApplicationCommandType.ChatInput,
    name: 'channel',
    description: `Set the channel where ${variables.keywords.collectible.plural} will spawn.`,
    integration_types: [ApplicationIntegrationType.GuildInstall],
    contexts: [InteractionContextType.Guild],
    options: [
      {
        type: ApplicationCommandOptionType.Channel,
        name: 'channel',
        description: `The channel to spawn ${variables.keywords.collectible.plural} in. Leave empty to reset.`,
        required: false,
        channel_types: [ChannelType.GuildText],
      },
    ],
  },
  code: `
  $onlyIf[$hasPerms[$guildID;$authorID;ManageGuild];
    $err[no_perms;true]
  ]
  
  $let[ch;$option[channel]]
  $jsonLoad[config;$getGuildVar[spawnConfig]]
  $!jsonSet[config;config_channel;"$get[ch]"]
  $setGuildVar[spawnConfig;$env[config]]
  
 
  $interactionReply[
    $ephemeral
    $addContainer[
      $addTextDisplay[$if[$get[ch]==;Removed the spawn channel. $jsonVar[keywords;collectible.plural] will now spawn in the most active channel of the server.;$jsonVar[keywords;collectible.plural] will now spawn in <#$get[ch]>]]
    ;#00FF00]
  ]
  `,
});
