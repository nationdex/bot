import { ApplicationCommand } from '@tryforge/forgescript';
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ApplicationIntegrationType,
} from 'discord.js';

export default new ApplicationCommand({
  data: {
    type: ApplicationCommandType.ChatInput,
    name: 'unblock',
    description: 'Unblock a user.',
    integration_types: [
      ApplicationIntegrationType.UserInstall,
      ApplicationIntegrationType.GuildInstall,
    ],
    options: [
      {
        type: ApplicationCommandOptionType.User,
        name: 'user',
        description: 'The user you want to unblock.',
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
  
  $onlyIf[$arrayIncludes[blocked;$get[user]];
    $err[You have not blocked this user.;true]
  ]
  
  $!jsonDelete[blocked;$arrayIndexOf[blocked;$get[user]]]
  $setUserVar[blockedUsers;$env[blocked]]
  
  $interactionReply[
    $ephemeral
    $addContainer[
      $addTextDisplay[Unblocked <@$get[user]> (\`$username[$get[user]]\`)]
    ;#00FF00]
  ]
  `,
});
