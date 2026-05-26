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
    description: 'View your most duplicate nations.',
    integration_types: [
      ApplicationIntegrationType.UserInstall,
      ApplicationIntegrationType.GuildInstall,
    ],
    options: [
      {
        type: ApplicationCommandOptionType.String,
        name: 'class',
        description: 'The class whose nations to show.',
        required: false,
        autocomplete: true,
      },
    ],
  },
  code: `
  $jsonLoad[classes;$getNationsData[classes]]
  $let[class;$if[$arrayIncludes[classes;$env[class]];$env[class]]]
  $let[special;$option[special]]
  $jsonLoad[nations;$getUserData[$authorID;nations]]
  $jsonLoad[specials;$getGlobalVar[specials]]
  $jsonLoad[data;{}]
  $arrayForEach[nations;nat;
    $let[nation;$getNation[$env[nat];nation]]
    $jsonLoad[ids;$jsonKeys[data]]
    $if[$arrayIncludes[ids;$get[nation]];
      $!jsonSet[data;$get[nation];total;$sum[$env[data;$get[nation];total];1]]
      ;$!jsonSet[data;$get[nation];{
        "total": 1,
        "nations": {}
      }]
    ]
    $jsonLoad[ids;$env[data;$get[nation];nations]]
    $!jsonSet[data;$get[nation];nations;$env[nat];$sum[$getNation[$env[nat];attack];$getNation[$env[nat];health]]]
    $if[$and[$get[class]!=;$getNationInfo[$get[nation];class]!=$get[class]];
      $!jsonDelete[data;$get[nation]]
    ]
  ]
    
    $onlyIf[$env[data]!={};
      $err[No nations found.;true]
    ]
    
    $jsonLoad[sorted;$sortData[$env[data];total;desc]]
    $jsonLoad[ids;$jsonKeys[sorted]]
    $let[nation;$env[ids;0]]
    $jsonLoad[nation;$env[sorted;$get[nation]]]
    $jsonLoad[nations;$sortData[$env[nation;nations];;desc]]
    $jsonLoad[nids;$jsonKeys[nations]]
    $arrayMap[nids;nat;$return[\`#$env[nat]\` $getSpecial[$getNation[$env[nat];special];emoji]$appEmoji[$getNationInfo[$getNation[$env[nat];nation];emoji_id]]: ATK: $appEmoji[$getNation[$env[nat];attack_type]] **$getNation[$env[nat];attack]** | HP: $appEmoji[$getNation[$env[nat];health_type]] **$getNation[$env[nat];health]**];natDisp]
    $arraySlice[natDisp;natDisp;0;10]
    
    $interactionReply[
      $addContainer[
        $addTextDisplay[### Your most duplicate $if[$get[class]!=;$get[class] nation;nation] is:
$appEmoji[$getNationInfo[$get[nation];emoji_id]] **$getNationInfo[$get[nation];name]**
-# You have total **$env[nation;total]** of this nation]
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
