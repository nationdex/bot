import { ctbl } from '../../config/collectible';
import { ApplicationCommand } from '@tryforge/forgescript';
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ApplicationIntegrationType,
} from 'discord.js';

export default new ApplicationCommand({
  data: {
    type: ApplicationCommandType.ChatInput,
    name: 'progress',
<<<<<<< HEAD
    description: `View your ${ctbl.plural} progress`,
=======
    description: 'View your nations progress.',
>>>>>>> 75fab9078c52d8dafa1292fa3b6accead582b5e0
    integration_types: [
      ApplicationIntegrationType.GuildInstall,
      ApplicationIntegrationType.UserInstall,
    ],
    options: [
      {
        type: ApplicationCommandOptionType.User,
        name: 'user',
        description: `The user whose ${ctbl.plural} progress to view.`,
        required: false,
      },
      {
        type: ApplicationCommandOptionType.String,
        name: 'class',
        description: 'The rarity class to view.',
        required: false,
        autocomplete: true,
      },
    ],
  },
  code: `
  $let[user;$findUser[$option[user];true]]
  $let[class;$option[class]]
  $jsonLoad[blocked;$getUserVar[blockedUsers;$get[user]]]
  
  $onlyIf[$isBot[$get[user]]==false;
    $err[Bots cannot collect ${ctbl.plural}, sadly.;true]
  ]
  $if[$get[user]!=$authorID;
    $onlyIf[$userSettings[$get[user];inventory_privacy]==public;
      $err[<@$get[user]> has their inventory private.;true]
    ]
  ]
  $onlyIf[$arrayIncludes[blocked;$authorID]==false;
    $err[Something went wrong.;true]
  ]
  
  $interactionReply[
    $addTextDisplay[Fetching ${ctbl.plural} data of **$userDisplayName[$get[user]]**...]
  ]
  
  $interactionUpdate[
    $progressMenu[$get[user];$get[class];1]
  ]
  `,
});
