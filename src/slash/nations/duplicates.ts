import { ApplicationCommand } from '@tryforge/forgescript';
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ApplicationIntegrationType,
} from 'discord.js';
import { ctbl } from '../../config/collectible';
import { config } from '../../config/config';

export default new ApplicationCommand({
  data: {
    type: ApplicationCommandType.ChatInput,
    name: 'duplicates',
    description: `View your most duplicated ${ctbl.plural}`,
    integration_types: [
      ApplicationIntegrationType.UserInstall,
      ApplicationIntegrationType.GuildInstall,
    ],
    options: [
      {
        type: ApplicationCommandOptionType.String,
        name: 'class',
        description: `The class whose ${ctbl.plural} to show`,
        required: false,
        autocomplete: true,
      },
    ],
  },
  code: `
  $jsonLoad[classes;$collectiblesData[classes]]
  $let[class;$if[$arrayIncludes[classes;$env[class]];$env[class]]]
  $let[special;$option[special]]
  $jsonLoad[nations;$getUserData[$authorID;collectibleIds]]
  $jsonLoad[specials;$getGlobalVar[specials]]
  $jsonLoad[data;{}]
  $arrayForEach[nations;nat;
    $let[colId;$collectible[$env[nat];id]]
    $jsonLoad[ids;$jsonKeys[data]]
    $if[$arrayIncludes[ids;$get[colId]];
      $!jsonSet[data;$get[colId];total;$sum[$env[data;$get[colId];total];1]]
      ;$!jsonSet[data;$get[colId];{
        "total": 1,
        "collectibles": {}
      }]
    ]
    $jsonLoad[ids;$env[data;$get[colId];collectibles]]
    $!jsonSet[data;$get[colId];collectibles;$env[nat];$sum[$collectible[$env[nat];attack];$collectible[$env[nat];health]]]
    $if[$and[$get[class]!=;$collectibleInfo[$get[colId];class]!=$get[class]];
      $!jsonDelete[data;$get[colId]]
    ]
  ]
    
    $onlyIf[$env[data]!={};
      $err[No ${ctbl.plural} found;true]
    ]
    $jsonLoad[sorted;$sortData[$env[data];total;desc]]
    $log[$env[sorted]]
    $jsonLoad[ids;$jsonKeys[sorted]]
    $let[colId;$env[ids;0]]
    $jsonLoad[colId;$env[sorted;$get[colId]]]
    $jsonLoad[nations;$sortData[$env[colId;collectibles];;desc]]
    $jsonLoad[nids;$jsonKeys[nations]]
    $arrayMap[nids;nat;$return[\`#$env[nat]\` $getSpecial[$collectible[$env[nat];special];emoji]$appEmoji[$collectibleInfo[$collectible[$env[nat];collectible];emoji_id]]: ATK: $appEmoji[$collectible[$env[nat];attack_type]] **$collectible[$env[nat];attack]** | HP: $appEmoji[$collectible[$env[nat];health_type]] **$collectible[$env[nat];health]**];natDisp]
    $arraySlice[natDisp;natDisp;0;10]
    
    $interactionReply[
      $addContainer[
        $addTextDisplay[### Your most duplicate $get[class] ${ctbl.singular} is:
$appEmoji[$collectibleInfo[$get[colId];emoji_id]] **$collectibleInfo[$get[colId];name]**
-# You have a total of **$env[colId;total]** of this ${ctbl.singular}]
        $addSeparator
        $addTextDisplay[
          **Top 10 that you caught**:
$arrayJoin[natDisp;
]
]
      ;${config.color}]
    ]
  `,
});
