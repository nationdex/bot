import { SlashCommand } from '../../util/slashes';

export default SlashCommand('collectibles.duplicates', `
  $let[class;$if[$isValidClass[$env[class]];$env[class]]]
  $let[special;$option[special]]
  $jsonLoad[collectibles;$getUserData[$authorID;collectibleIDs]]
  $jsonLoad[specials;$getGlobalVar[specials]]
  $jsonLoad[data;{}]
  $arrayForEach[collectibles;nat;
    $let[colID;$collectible[$env[nat];id]]
    $jsonLoad[ids;$jsonKeys[data]]
    $if[$arrayIncludes[ids;$get[colID]];
      $!jsonSet[data;$get[colID];total;$sum[$env[data;$get[colID];total];1]]
      ;$!jsonSet[data;$get[colID];{
        "total": 1,
        "collectibles": {}
      }]
    ]
    $jsonLoad[ids;$env[data;$get[colID];collectibles]]
    $!jsonSet[data;$get[colID];collectibles;$env[nat];$sum[$collectible[$env[nat];attack];$collectible[$env[nat];health]]]
    $if[$and[$get[class]!=;$collectibleInfo[$get[colID];class]!=$get[class]];
      $!jsonDelete[data;$get[colID]]
    ]
  ]
    
  $onlyIf[$env[data]!={};
    $err[no_collectibles_found;true]
  ]
  $jsonLoad[sorted;$sortData[$env[data];total;desc]]
  $log[$env[sorted]]
  $jsonLoad[ids;$jsonKeys[sorted]]
  $let[colID;$env[ids;0]]
  $jsonLoad[colID;$env[sorted;$get[colID]]]
  $jsonLoad[collectibles;$sortData[$env[colID;collectibles];;desc]]
  $jsonLoad[nids;$jsonKeys[collectibles]]
  $arrayMap[nids;nat;$return[\`#$env[nat]\` $getSpecial[$collectible[$env[nat];special];emoji]$appEmoji[$collectibleInfo[$collectible[$env[nat];id];emoji_id]]: ATK: $appEmoji[$collectible[$env[nat];attack_type]] **$collectible[$env[nat];attack]** | HP: $appEmoji[$collectible[$env[nat];health_type]] **$collectible[$env[nat];health]**];natDisp]
  $arraySlice[natDisp;natDisp;0;10]
  
  $interactionReply[
    $addContainer[
      $addTextDisplay[### Your most duplicate $get[class] $jsonVar[keywords;collectible.singular] is:
$appEmoji[$collectibleInfo[$get[colID];emoji_id]] **$collectibleInfo[$get[colID];name]**
-# You have a total of **$env[colID;total]** of this $jsonVar[keywords;collectible.singular]]
      $addSeparator
      $addTextDisplay[
        **Top 10 that you caught**:
$arrayJoin[natDisp;
]
]
    ;$jsonVar[config;accent]]
  ]
`);
