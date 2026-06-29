import { ApplicationCommand } from '@tryforge/forgescript';
import {
  ApplicationCommandType,
  ApplicationIntegrationType
} from 'discord.js';
import { ctbl } from '../../config/collectible';
import { config } from '../../config/config';

export default new ApplicationCommand({
  data: {
    type: ApplicationCommandType.ChatInput,
    name: 'about',
    description: `About ${config.name}`,
    integration_types: [
      ApplicationIntegrationType.GuildInstall,
      ApplicationIntegrationType.UserInstall,
    ],
  },
  independent: true,
  code: `
  $interactionReply[
    $addContainer[
      $addSection[
        $addTextDisplay[## $appEmoji[info] ${config.name}
${config.description}]
        $addThumbnail[$userAvatar[$botID]]
      ]
      $addSeparator
      $addTextDisplay[**Stats**
**$collectiblesData[total]** ${ctbl.plural} to collect • **$guildCount** servers • **$userCount** users • **$collectiblesData[total_caught]** ${ctbl.plural} caught
Version **${config.version}**
Uptime: **$parseMS[$uptime;2]**]
      $addTextDisplay[**Credits**
$appEmoji[crown] **[${config.author.name}\\](${config.author.profile})** Founder
$appEmoji[code] **[${config.dev.name}\\](${config.dev.profile})** Bot Developer
$appEmoji[code] **[${config.webDev.name}\\](${config.webDev.profile})** Web Developer
-# Made with 💙 using [ForgeScript\\](https://docs.botforge.org/?p=ForgeScript) and its extensions!
]
      
      $addSeparator
      $addActionRow
      $addButton[${config.server};Support;Link]
      $addButton[$botInvite;Invite;Link]
      $addButton[${config.repo};Source Code;Link]
      $addActionRow
      $addButton[${config.terms};ToS;Link]
      $addButton[${config.policy};Privacy Policy;Link]
    ;${config.color}]
  ]
  `,
});
