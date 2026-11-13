import { command } from '../../core/define/commands';

export default command('autocomplete.auction', `
  $onlyIf[$applicationCommandName==auction]
  $let[val;$replace[$toLowerCase[$focusedOptionValue];#;]]

  $ifx[
    $if[$focusedOptionName==$jsonVar[keywords;collectible.singular];
      $jsonLoad[userCollectibles;$getUserData[$authorID;collectibleIDs]]
      $if[$get[val]!=;
        $arrayMap[userCollectibles;nat;
          $let[colID;$collectible[$env[nat];id]]
          $if[$or[$checkContains[$toLowerCase[$env[nat]];$get[val]];$checkContains[$toLowerCase[$collectibleInfo[$get[colID];name]];$get[val]];$checkContains[$toLowerCase[$collectibleInfo[$get[colID];catch_names;,]];$get[val]]];
            $return[$env[nat]]
          ]
        ;userCollectibles]
      ]
      $arraySlice[userCollectibles;userCollectibles;0;25]
      $onlyIf[$arrayLength[userCollectibles]>0;
        $addChoice[You don't have any $jsonVar[keywords;collectible.plural];none]
      ]
      $arrayForEach[userCollectibles;nat;
        $let[colID;$collectible[$env[nat];id]]
        $addChoice[#$env[nat]: $getSpecial[$collectible[$env[nat];special];emoji] $collectibleInfo[$get[colID];name] | ($collectible[$env[nat];attack] $collectible[$env[nat];health]);$env[nat]]
      ]
    ]
  ]
`);
