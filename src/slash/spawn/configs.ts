import { ApplicationCommand } from '@tryforge/forgescript';
import {
  ApplicationCommandType,
  ApplicationIntegrationType,
  InteractionContextType,
} from 'discord.js';

export default new ApplicationCommand({
  data: {
    type: ApplicationCommandType.ChatInput,
    name: 'configs',
    description: 'Check the spawn configuration of the server.',
    integration_types: [ApplicationIntegrationType.GuildInstall],
    contexts: [InteractionContextType.Guild],
  },
  code: `
  $onlyIf[$hasPerms[$guildID;$authorID;ManageGuild];
    $err[no_perms;true]
  ]
  
  $jsonLoad[config;$getGuildVar[spawnConfig]]
  $let[ch;$env[config;config_channel]]
  $let[status;$env[config;status]]
  $let[lastCollectible;$env[config;timestamp]]
  
  $interactionReply[
    $ephemeral
    $addContainer[
      $addSection[
        $addTextDisplay[$appEmoji[settings] Server Configuration
-# $jsonVar[config;bot.name] is $if[$and[$get[status]==enabled;$get[ch]!=];configured;not configured] in this server.]
        $addThumbnail[$default[$guildIcon;$userAvatar]]
      ]
      $addSeparator
      $addTextDisplay[Spawn Channel: $if[$get[ch]!=;<#$get[ch]>;Not Set]
Status: **$get[status]**
Last spawn: $if[$get[lastCollectible]!=;$discordTimestamp[$get[lastCollectible];RelativeTime];No $jsonVar[keywords;collectible.plural] have spawned yet]
]
    ;$jsonVar[config;accent]]
  ]
  `,
});
