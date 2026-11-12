import { SlashCommand } from '../../core/slashes';

export default SlashCommand('rarity.info', `
  $let[rawInput;$trim[$option[$jsonVar[keywords;collectible.singular]]]]
  $onlyIf[$get[rawInput]!=;
    $err[invalid_collectible;true]
  ]

  $let[cleanInput;$trim[$replace[$get[rawInput];#;]]]
  $let[lowerInput;$toLowerCase[$get[cleanInput]]]

  $jsonLoad[sorted;$sortData[$collectiblesData[collectibles];rarity;desc]]
  $jsonLoad[ids;$jsonKeys[sorted]]

  $let[colID;]

  $if[$and[$get[cleanInput]!=;$arrayIndexOf[ids;$get[cleanInput]]!=-1];
    $let[colID;$get[cleanInput]]
  ]

  $if[$get[colID]==;
    $arrayForEach[ids;cid;
      $if[$get[colID]==;
        $let[cName;$toLowerCase[$collectibleInfo[$env[cid];name]]]
        $let[sName;$toLowerCase[$replace[$collectibleInfo[$env[cid];short_name];null;]]]
        $if[$or[$get[cName]==$get[lowerInput];$and[$get[sName]!=;$get[sName]==$get[lowerInput]]];
          $let[colID;$env[cid]]
        ]
      ]
    ]
  ]

  $if[$get[colID]==;
    $arrayForEach[ids;cid;
      $if[$get[colID]==;
        $let[cns;$toLowerCase[$collectibleInfo[$env[cid];catch_names;,]]]
        $let[trs;$toLowerCase[$collectibleInfo[$env[cid];translations;,]]]
        $if[$or[$checkContains[,$get[cns],;,$get[lowerInput],];$checkContains[,$get[trs],;,$get[lowerInput],]];
          $let[colID;$env[cid]]
        ]
      ]
    ]
  ]

  $if[$get[colID]==;
    $arrayForEach[ids;cid;
      $if[$get[colID]==;
        $let[cName;$toLowerCase[$collectibleInfo[$env[cid];name]]]
        $let[sName;$toLowerCase[$replace[$collectibleInfo[$env[cid];short_name];null;]]]
        $if[$or[$checkContains[$get[cName];$get[lowerInput]];$and[$get[sName]!=;$checkContains[$get[sName];$get[lowerInput]]]];
          $let[colID;$env[cid]]
        ]
      ]
    ]
  ]

  $onlyIf[$and[$get[colID]!=;$arrayIndexOf[ids;$get[colID]]!=-1];
    $err[invalid_collectible;true]
  ]

  $let[value;$collectibleInfo[$get[colID];weight]]
  $let[rarity;$collectibleInfo[$get[colID];rarity]]
  $let[totalRarity;$math[$collectiblesData[rarity;+]]]
  $let[chance;$cropText[$math[($get[rarity]/$get[totalRarity])*100];0;5]%]

  $let[colEmoji;$appEmoji[$collectibleInfo[$get[colID];emoji_id]]]

  $interactionReply[
    $addContainer[
      $addTextDisplay[## $if[$get[colEmoji]!=;$get[colEmoji] ]$collectibleInfo[$get[colID];name]
-# Class: **$toTitleCase[$collectibleInfo[$get[colID];class]]**]
      $addSeparator
      $addTextDisplay[- Value: **$get[value]**
- Spawn Chance: \`$get[chance]\`
- Rarity Weight: \`$get[rarity]\`
- Rarity Rank: \`#$sum[$arrayIndexOf[ids;$get[colID]];1]\`]
    ;$jsonVar[config;accent]]
  ]
`);
