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
    description: 'View info card of your nations.',
    integration_types: [
      ApplicationIntegrationType.UserInstall,
      ApplicationIntegrationType.GuildInstall,
    ],
    options: [
      {
        type: ApplicationCommandOptionType.String,
        name: 'nation',
        description: 'The nation whose info card to view.',
        required: false,
        autocomplete: true,
      },
    ],
  },
  code: `
  $jsonLoad[nations;$getUserData[$authorID;nations]]
  $let[id;$default[$option[nation];$env[nations;0]]]
  $let[ind;$arrayIndexOf[nations;$get[id]]]
  $let[prev;$env[nations;$sub[$get[ind];1]]]
  $let[next;$env[nations;$sum[$get[ind];1]]]
  
  $onlyIf[$arrayIncludes[nations;$get[id]];
    $err[Invalid nation!;true]
  ]
  $onlyIf[$arrayLength[nations]>0;
    $err[No nations found.;true]
  ]
  
  $interactionReply[
    $nationCard[$get[id]]
    $addActionRow
    $addButton[pages-nationInfo-$authorID-$get[prev]-prev;;Secondary;$appEmoji[arrow_left];$if[$get[prev]==;true]]
    $addButton[pages-nationInfo-$authorID-index;$sum[$get[ind];1] / $arrayLength[nations];Primary;;true]
    $addButton[pages-nationInfo-$authorID-$get[next]-next;;Secondary;$appEmoji[arrow_right];$if[$get[next]==;true]]
  ]
  `,
});
