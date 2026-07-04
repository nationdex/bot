import { ApplicationCommand } from '@tryforge/forgescript';
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ApplicationIntegrationType,
} from 'discord.js';

export default new ApplicationCommand({
  data: {
    type: ApplicationCommandType.ChatInput,
    name: 'block',
    description: 'Block a user.',
    integration_types: [
      ApplicationIntegrationType.UserInstall,
      ApplicationIntegrationType.GuildInstall,
    ],
    options: [
      {
        type: ApplicationCommandOptionType.User,
        name: 'user',
        description: 'The user you want to block.',
        required: true,
      },
    ],
  },
  code: `
  $let[user;$option[user]]
  $jsonLoad[blocked;$getUserVar[blockedUsers]]
  
  $onlyIf[$userExists[$get[user]];
    $err[Something went wrong.;true]
  ]
  $onlyIf[$isBot[$get[user]]==false;
    $err[You cannot block bots.;true]
  ]
  $onlyIf[$get[user]!=$authorID;
    $err[You cannot block yourself.;true]
  ]
  $onlyIf[$arrayIncludes[blocked;$get[user]]==false;
    $err[You have already blocked this user.;true]
  ]
  
  $!jsonSet[blocked;$arrayLength[blocked];"$get[user]"]
  $setUserVar[blockedUsers;$env[blocked]]
  
  $interactionReply[
    $ephemeral
    $addContainer[
      $addTextDisplay[Blocked <@$get[user]> (\`$username[$get[user]]\`).]
    ;#00FF00]
  $addActionRow
  $addButton[info-block;;Secondary;$appEmoji[question_mark]]
  ]
  `,
});
