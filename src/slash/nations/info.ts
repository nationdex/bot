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
    name: 'info',
    description: `View info card of your ${ctbl.plural}.`,
    integration_types: [
      ApplicationIntegrationType.UserInstall,
      ApplicationIntegrationType.GuildInstall,
    ],
    options: [
      {
        type: ApplicationCommandOptionType.String,
        name: `${ctbl.singular}`,
        description: `The ${ctbl.singular} whose info card to view.`,
        required: false,
        autocomplete: true,
      },
    ],
  },
  code: `
  $jsonLoad[nations;$getUserData[$authorID;collectibleIds]]
  $let[id;$default[$option[${ctbl.singular}];$env[nations;0]]]
  $let[ind;$arrayIndexOf[nations;$get[id]]]
  $let[prev;$env[nations;$sub[$get[ind];1]]]
  $let[next;$env[nations;$sum[$get[ind];1]]]
  
  $onlyIf[$arrayIncludes[nations;$get[id]];
    $err[Invalid ${ctbl.singular}!;true]
  ]
  $onlyIf[$arrayLength[nations]>0;
<<<<<<< HEAD
    $err[No ${ctbl.plural} found;true]
=======
    $err[No nations found.;true]
>>>>>>> 75fab9078c52d8dafa1292fa3b6accead582b5e0
  ]

  $interactionReply[Loading ${ctbl.singular} info...]
  
  $interactionUpdate[
    $collectibleCard[$get[id]]
    $addActionRow
    $addButton[pages-collectibleInfo-$authorID-$get[prev]-prev;;Secondary;$appEmoji[arrow_left];$if[$get[prev]==;true]]
    $addButton[pages-collectibleInfo-$authorID-index;$sum[$get[ind];1] / $arrayLength[nations];Primary;;true]
    $addButton[pages-collectibleInfo-$authorID-$get[next]-next;;Secondary;$appEmoji[arrow_right];$if[$get[next]==;true]]
  ]
  `,
});
