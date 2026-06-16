import { ApplicationCommand } from '@tryforge/forgescript';
import { 
  ApplicationCommandType, 
  ApplicationIntegrationType,
  InteractionContextType,
} from 'discord.js';
import { config } from '../../config/config';
import { ctbl } from '../../config/collectible';

export default new ApplicationCommand({
  data: {
    type: ApplicationCommandType.ChatInput,
    name: 'configs',
    description: "Check server's spawn configurations.",
    integration_types: [
      ApplicationIntegrationType.GuildInstall
    ],
    contexts: [
      InteractionContextType.Guild,
    ],
  },
  code: `
  $onlyIf[$hasPerms[$guildID;$authorID;ManageGuild];
    $err[You need **Manage Server** permissions to use this command.;true]
  ]
  
  $jsonLoad[config;$getGuildVar[spawnConfig]]
  $let[ch;$env[config;config_channel]]
  $let[status;$env[config;status]]
  $let[lastNation;$env[config;timestamp]]
  
  $interactionReply[
    $ephemeral
    $addContainer[
      $addSection[
        $addTextDisplay[$appEmoji[settings] Server Configs
-# ${config.name} is $if[$and[$get[status]==enabled;$get[ch]!=];configured;not configured] in this server.]
        $addThumbnail[$default[$guildIcon;$userAvatar]]
      ]
      $addSeparator
      $addTextDisplay[Spawn Channel: $if[$get[ch]!=;<#$get[ch]>;Not Set]
Status: **$get[status]**
Last spawn: $if[$get[lastNation]!=;$discordTimestamp[$get[lastNation];RelativeTime];No ${ctbl.plural} spawned]
]
    ;${config.color}]
  ]
  `,
});
