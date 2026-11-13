import { SlashCommand } from '../../core/define/slashes';

export default SlashCommand('collectibles.duplicates', `
  $let[rawClass;$toLowerCase[$default[$replace[$option[class];null;];]]]
  $let[class;$if[$isValidClass[$get[rawClass]];$get[rawClass];]]
  $let[special;$option[special]]
  $jsonLoad[collectibles;$getUserData[$authorID;collectibleIDs]]
  $jsonLoad[specials;$getGlobalVar[specials]]
  $jsonLoad[data;{}]
  $let[maxCount;0]
  $let[topColID;]
  $arrayForEach[collectibles;nat;
    $let[colID;$collectible[$env[nat];id]]
    $if[$or[$get[class]==;$collectibleInfo[$get[colID];class]==$get[class]];
      $if[$jsonHas[data;$get[colID]];
        $let[newTotal;$sum[$env[data;$get[colID];total];1]]
        $!jsonSet[data;$get[colID];total;$get[newTotal]]
      ;
        $let[newTotal;1]
        $!jsonSet[data;$get[colID];{
          "total": 1,
          "collectibles": {}
        }]
      ]
      $!jsonSet[data;$get[colID];collectibles;$env[nat];$sum[$collectible[$env[nat];attack];$collectible[$env[nat];health]]]
      $if[$get[newTotal]>$get[maxCount];
        $let[maxCount;$get[newTotal]]
        $let[topColID;$get[colID]]
      ]
    ]
  ]
    
  $onlyIf[$get[topColID]!=;
    $err[no_collectibles_found;true]
  ]
  $onlyIf[$get[maxCount]>1;
    $err[You do not have any duplicate $if[$get[class]!=;$toTitleCase[$get[class]] ]$jsonVar[keywords;collectible.plural]!;true]
  ]
  $let[colID;$get[topColID]]
  $jsonLoad[colData;$env[data;$get[colID]]]
  $jsonLoad[collectibles;$sortData[$env[colData;collectibles];;desc]]
  $jsonLoad[nids;$jsonKeys[collectibles]]
  $arrayMap[nids;nat;$return[\`#$env[nat]\` $getSpecial[$collectible[$env[nat];special];emoji]$appEmoji[$collectibleInfo[$collectible[$env[nat];id];emoji_id]] ATK: $appEmoji[$collectible[$env[nat];attack_type]] **$collectible[$env[nat];attack]** | HP: $appEmoji[$collectible[$env[nat];health_type]] **$collectible[$env[nat];health]**];natDisp]
  $arraySlice[natDisp;natDisp;0;10]
  
  $interactionReply[
    $addContainer[
      $addTextDisplay[### Your most duplicate $if[$get[class]!=;$toTitleCase[$get[class]] ]$jsonVar[keywords;collectible.singular] is:
$appEmoji[$collectibleInfo[$get[colID];emoji_id]] **$collectibleInfo[$get[colID];name]**
-# You have a total of **$env[colData;total]** of this $jsonVar[keywords;collectible.singular]]
      $addSeparator
      $addTextDisplay[
        **Top 10 that you caught**:
$arrayJoin[natDisp;
]
]
    ;$jsonVar[config;accent]]
  ]
`);
