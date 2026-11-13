import { command } from '../../core/define/commands';

export default command('autocomplete.collectibles', `
  $onlyIf[$and[$applicationCommandName==$jsonVar[keywords;collectible.plural];$focusedOptionName==$jsonVar[keywords;collectible.singular]]]
  
  $jsonLoad[userCollectibles;$getUserData[$authorID;collectibleIDs]]
  $let[val;$replace[$toLowerCase[$focusedOptionValue];#;]]
  
  $if[$get[val]!=;
    $arrayMap[userCollectibles;nat;
      $let[colID;$collectible[$env[nat];id]]
      $let[cns;$toLowerCase[$collectibleInfo[$get[colID];catch_names;,]]]
      $let[trs;$toLowerCase[$collectibleInfo[$get[colID];translations;,]]]
      
      $if[$or[$checkContains[$toLowerCase[$env[nat]];$get[val]];$checkContains[$toLowerCase[$collectibleInfo[$get[colID];name]];$get[val]];$checkContains[$toLowerCase[$collectibleInfo[$get[colID];short_name]];$get[val]];$checkContains[$get[trs];$get[val]];$checkContains[$get[cns];$get[val]]];
        $return[$env[nat]]
      ]
    ;userCollectibles]
  ]
  
  $arraySlice[userCollectibles;userCollectibles;0;25]
  
  $onlyIf[$arrayLength[userCollectibles]>0;
    $addChoice[You don't have any $jsonVar[keywords;collectible.plural];null]
  ]
      
  $arrayForEach[userCollectibles;nat;
    $let[colID;$collectible[$env[nat];id]]
    $addChoice[#$env[nat]: $getSpecial[$collectible[$env[nat];special];emoji] $collectibleInfo[$get[colID];name] | ($collectible[$env[nat];attack] $collectible[$env[nat];health]) | $parseDate[$collectible[$env[nat];timestamp];Locale];$env[nat]]
  ]
`);
