import { ApplicationCommand } from '@tryforge/forgescript';
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ApplicationIntegrationType,
} from 'discord.js';
import { ctbl } from '../../config/collectible';

export default new ApplicationCommand({
  data: {
    type: ApplicationCommandType.ChatInput,
    name: 'progress',
    description: `View your ${ctbl.singular} collection progress`,
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
  
  $onlyIf[$isBot[$get[user]]==false;
    $err[bots_cant_collect;true]
  ]
  $if[$get[user]!=$authorID;
    $onlyIf[$userSettings[$get[user];inventory_privacy]==public;
      $err[inv_private;true]
    ]
  ]
  
  $interactionReply[
    $addTextDisplay[Fetching ${ctbl.plural} data for **$userDisplayName[$get[user]]**...]
  ]
  
  $interactionUpdate[
    $progressMenu[$get[user];$get[class];1]
  ]
  `,
});
