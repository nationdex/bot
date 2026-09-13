import { command } from '../../../util/commands';

export default command('autocomplete.rarity', `
  $onlyIf[$and[$applicationCommandName==rarity;$applicationSubCommandName==info;$focusedOptionName==$jsonVar[keywords;collectible.singular]];]
  
  $jsonLoad[allCtbls;$collectiblesData[collectibles]]
  $jsonLoad[ctbls;$jsonKeys[allCtbls]]
  $let[val;$replace[$toLowerCase[$focusedOptionValue];#;]]
  $if[$get[val]!=;
    $arrayMap[ctbls;nat;
      $let[cns;$toLowerCase[$collectibleInfo[$env[nat];catch_names;,]]]
      $let[trs;$toLowerCase[$collectibleInfo[$env[nat];translations;,]]]
      $if[$or[$checkContains[$toLowerCase[$env[nat]];$get[val]];$checkContains[$toLowerCase[$collectibleInfo[$env[nat];name]];$get[val]];$checkContains[$toLowerCase[$collectibleInfo[$env[nat];short_name]];$get[val]];$checkContains[$get[trs];$get[val]];$checkContains[$get[cns];$get[val]]];
        $return[$env[nat]]
      ]
    ;ctbls]
  ]
  $arraySlice[ctbls;ctbls;0;25]
  
  $onlyIf[$arrayLength[ctbls]>0;
    $addChoice[No $jsonVar[keywords;collectible.plural] found;null]
  ]
  
  $arrayForEach[ctbls;nat;$addChoice[#$env[nat]: $collectibleInfo[$env[nat];name];$env[nat]]]
`);
