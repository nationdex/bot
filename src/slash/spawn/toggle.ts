import { ApplicationCommand } from '@tryforge/forgescript';
import {
  ApplicationCommandType,
  ApplicationIntegrationType,
  InteractionContextType,
} from 'discord.js';
import { ctbl } from '../../config/collectible';

export default new ApplicationCommand({
  data: {
    type: ApplicationCommandType.ChatInput,
    name: 'toggle',
    description: `Toggle ${ctbl.plural} spawning on or off in the server.`,
    integration_types: [ApplicationIntegrationType.GuildInstall],
    contexts: [InteractionContextType.Guild],
  },
  code: `
  $onlyIf[$hasPerms[$guildID;$authorID;ManageGuild];
    $err[You need **Manage Server** permissions to use this command.;true]
  ]
  
  $jsonLoad[config;$getGuildVar[spawnConfig]]
  $let[toggle;$if[$env[config;status]==enabled;disabled;enabled]]
  $!jsonSet[config;status;$get[toggle]]
  $setGuildVar[spawnConfig;$env[config]]
  
 
  $interactionReply[
    $ephemeral
    $addContainer[
      $addTextDisplay[$toTitleCase[$get[toggle]] ${ctbl.plural} spawning in this server.]
    ;#00FF00]
  ]
  `,
});
