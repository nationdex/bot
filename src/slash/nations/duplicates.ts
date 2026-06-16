<<<<<<< HEAD
import { config } from '../../config/config';
import { ctbl } from '../../config/collectible';
=======
>>>>>>> 75fab9078c52d8dafa1292fa3b6accead582b5e0
import { ApplicationCommand } from '@tryforge/forgescript';
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ApplicationIntegrationType,
} from 'discord.js';
import { config } from '../../config/config';

export default new ApplicationCommand({
  data: {
    type: ApplicationCommandType.ChatInput,
    name: 'duplicates',
<<<<<<< HEAD
    description: `View your most duplicate ${ctbl.plural}`,
=======
    description: 'View your most duplicate nations.',
>>>>>>> 75fab9078c52d8dafa1292fa3b6accead582b5e0
    integration_types: [
      ApplicationIntegrationType.UserInstall,
      ApplicationIntegrationType.GuildInstall,
    ],
    options: [
      {
        type: ApplicationCommandOptionType.String,
        name: 'class',
<<<<<<< HEAD
        description: `The class whose ${ctbl.plural} to show`,
=======
        description: 'The class whose nations to show.',
>>>>>>> 75fab9078c52d8dafa1292fa3b6accead582b5e0
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
<<<<<<< HEAD
      $err[No ${ctbl.plural} found;true]
=======
      $err[No nations found.;true]
>>>>>>> 75fab9078c52d8dafa1292fa3b6accead582b5e0
    ]
    
    $jsonLoad[sorted;$sortData[$env[data];total;desc]]
    $jsonLoad[ids;$jsonKeys[sorted]]
    $let[colId;$env[ids;0]]
    $jsonLoad[colId;$env[sorted;$get[colId]]]
    $jsonLoad[nations;$sortData[$env[colId;collectibles;;desc]]]
    $jsonLoad[nids;$jsonKeys[nations]]
    $arrayMap[nids;nat;$return[\`#$env[nat]\` $getSpecial[$collectible[$env[nat];special];emoji]$appEmoji[$collectibleInfo[$collectible[$env[nat];collectible];emoji_id]]: ATK: $appEmoji[$collectible[$env[nat];attack_type]] **$collectible[$env[nat];attack]** | HP: $appEmoji[$collectible[$env[nat];health_type]] **$collectible[$env[nat];health]**];natDisp]
    $arraySlice[natDisp;natDisp;0;10]
    
    $interactionReply[
      $addContainer[
        $addTextDisplay[### Your most duplicate $get[class] ${ctbl.singular} is:
$appEmoji[$collectibleInfo[$get[colId];emoji_id]] **$collectibleInfo[$get[colId];name]**
-# You have total **$env[colId;total]** of this ${ctbl.singular}]
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
