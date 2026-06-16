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
    name: 'last',
    description: `View info of the last ${ctbl.singular} you caught.`,
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
        description: `View info of the last ${ctbl.singular} you caught of a specific rarity class.`,
        required: false,
        autocomplete: true
      },
    ],
  },
  code: `
  $let[user;$findUser[$option[user];true]]
  $jsonLoad[classes;$collectiblesData[classes]]
  $let[class;$if[$arrayIncludes[classes;$env[class]];$env[class]]]
  $jsonLoad[blocked;$getUserVar[blockedUsers;$get[user]]]
  
  $onlyIf[$isBot[$get[user]]==false;
    $err[Bots cannot collect ${ctbl.plural}, sadly.;true]
  ]
  $if[$get[user]!=$authorID;
    $onlyIf[$userSettings[$get[user];inventory_privacy]==public;
      $err[<@$get[user]> have their inventory private;true]
    ]
  ]
  $onlyIf[$arrayIncludes[blocked;$authorID]==false;
    $err[Something went wrong;true]
  ]
  
  $jsonLoad[ctbls;$getUserData[$get[user];collectibleIds]]
  $if[$get[class]!=;
    $arrayMap[ctbls;colId;$if[$collectibleInfo[$collectible[$env[colId];id];class]==$get[class];$return[$env[colId]]];ctbls]
  ]
  
  $onlyIf[$arrayLength[ctbls]>0;
    $err[No ${ctbl.plural} found;true]
  ]
  
  $let[id;$env[ctbls;$sub[$arrayLength[ctbls];1]]]
  
  $interactionReply[
**Info of the last ${ctbl.singular} you caught**:
$collectibleCard[$get[id]]
  ]
  `,
});
