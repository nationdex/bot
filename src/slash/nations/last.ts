import { ApplicationCommand } from '@tryforge/forgescript';
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ApplicationIntegrationType,
} from 'discord.js';
import { variables } from '../../config/variables';

export default new ApplicationCommand({
  data: {
    type: ApplicationCommandType.ChatInput,
    name: 'last',
    description: `View info of the last ${variables.keywords.collectible.singular} caught.`,
    integration_types: [
      ApplicationIntegrationType.UserInstall,
      ApplicationIntegrationType.GuildInstall,
    ],
    options: [
      {
        type: ApplicationCommandOptionType.User,
        name: 'user',
        description: `The user whose last ${variables.keywords.collectible.singular} to check.`,
        required: false,
      },
      {
        type: ApplicationCommandOptionType.String,
        name: 'class',
        description: `View info of the last ${variables.keywords.collectible.singular} caught of a specific rarity class.`,
        required: false,
        autocomplete: true,
      },
    ],
  },
  code: `
  $let[user;$findUser[$option[user];true]]
  $jsonLoad[classes;$collectiblesData[classes]]
  $let[class;$if[$arrayIncludes[classes;$env[class]];$env[class]]]
  
  $onlyIf[$isBot[$get[user]]==false;
    $err[bots_cant_collect;true]
  ]
  $if[$get[user]!=$authorID;
    $onlyIf[$userSettings[$get[user];inventory_privacy]==public;
      $err[inv_private;true]
    ]
  ]
  
  $jsonLoad[ctbls;$getUserData[$get[user];collectibleIDs]]
  $if[$get[class]!=;
    $arrayMap[ctbls;colID;$if[$collectibleInfo[$collectible[$env[colID];id];class]==$get[class];$return[$env[colID]]];ctbls]
  ]
  
  $onlyIf[$arrayLength[ctbls]>0;
    $err[no_collectibles_found;true]
  ]
  
  $let[id;$env[ctbls;$sub[$arrayLength[ctbls];1]]]
  
  $interactionReply[
**Info on the last $jsonVar[keywords;collectible.singular] caught**:
$collectibleCard[$get[id]]
  ]
  `,
});
