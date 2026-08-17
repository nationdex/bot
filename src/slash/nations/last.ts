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
    name: 'last',
    description: `View info of the last ${ctbl.singular} caught.`,
    integration_types: [
      ApplicationIntegrationType.UserInstall,
      ApplicationIntegrationType.GuildInstall,
    ],
    options: [
      {
        type: ApplicationCommandOptionType.User,
        name: 'user',
        description: `The user whose last ${ctbl.singular} to check.`,
        required: false,
      },
      {
        type: ApplicationCommandOptionType.String,
        name: 'class',
        description: `View info of the last ${ctbl.singular} caught of a specific rarity class.`,
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
  
  $jsonLoad[ctbls;$getUserData[$get[user];collectibleIds]]
  $if[$get[class]!=;
    $arrayMap[ctbls;colId;$if[$collectibleInfo[$collectible[$env[colId];id];class]==$get[class];$return[$env[colId]]];ctbls]
  ]
  
  $onlyIf[$arrayLength[ctbls]>0;
    $err[no_collectibles_found;true]
  ]
  
  $let[id;$env[ctbls;$sub[$arrayLength[ctbls];1]]]
  
  $interactionReply[
**Info on the last ${ctbl.singular} caught**:
$collectibleCard[$get[id]]
  ]
  `,
});
