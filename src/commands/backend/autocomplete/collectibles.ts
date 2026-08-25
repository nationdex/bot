import { BaseCommand } from '@tryforge/forgescript';

export default new BaseCommand({
  type: 'interactionCreate',
  allowedInteractionTypes: ['autocomplete'],
  code: `
  $onlyIf[$and[$applicationCommandName==$jsonVar[keywords;collectible.plural];$focusedOptionName==$jsonVar[keywords;collectible.singular]]]
  
  $jsonLoad[userCollectibles;$getUserData[$authorID;collectibleIds]]
  $let[val;$replace[$toLowerCase[$focusedOptionValue];#;]]
  
  $if[$get[val]!=;
    $arrayMap[userCollectibles;nat;
      $let[colId;$collectible[$env[nat];id]]
      $jsonLoad[trs;$collectibleInfo[$get[colId];translations]]
      $jsonLoad[cns;$collectibleInfo[$get[colId];catching_names]]
      
      $if[$or[$checkContains[$toLowerCase[$env[nat]];$get[val]];$checkContains[$toLowerCase[$collectibleInfo[$get[colId];name]];$get[val]];$checkContains[$toLowerCase[$collectibleInfo[$get[colId];short_name]];$get[val]];$arrayIncludes[trs;$get[val]];$arrayIncludes[cns;$get[val]]];
        $return[$env[nat]]
      ]
    ;userCollectibles]
  ]
  
  $arraySlice[userCollectibles;userCollectibles;0;25]
  
  $onlyIf[$arrayLength[userCollectibles]>0;
    $addChoice[You don't have any $jsonVar[keywords;collectible.plural];null]
  ]
      
  $arrayForEach[userCollectibles;nat;
    $let[colId;$collectible[$env[nat];id]]
    $addChoice[#$env[nat]: $getSpecial[$collectible[$env[nat];special];emoji] $collectibleInfo[$get[colId];name] | ($collectible[$env[nat];attack] $collectible[$env[nat];health]) | $parseDate[$collectible[$env[nat];timestamp];Locale];$env[nat]]
  ]
  `,
});
