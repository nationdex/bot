import { BaseCommand } from '@tryforge/forgescript';

export default new BaseCommand({
  type: 'interactionCreate',
  allowedInteractionTypes: ['autocomplete'],
  code: `
  $onlyIf[$applicationCommandName==rarity]
  
  $ifx[
    $if[$and[$applicationSubCommandName==info;$focusedOptionName==nation];
      $jsonLoad[nations;$getNationsData[id]]
      $let[val;$toLowerCase[$focusedOptionValue]]
      $if[$get[val]!=;
        $arrayMap[nations;nat;
          $let[nation;$env[nat]]
          $jsonLoad[trs;$getNationInfo[$get[nation];translations]]
          $jsonLoad[cns;$getNationInfo[$get[nation];catching_namss]]
          $if[$or[$checkContains[$toLowerCase[$getNationInfo[$get[nation];name]];$get[val]];$checkContains[$toLowerCase[$getNationInfo[$get[nation];short_name]];$get[val]];$arrayIncludes[trs;$get[val]];$arrayIncludes[trs;$get[val]]];
            $return[$env[nat]]
          ]
        ;nations]
      ]
      $arraySlice[nations;nations;0;25]
      
      $onlyIf[$arrayLength[nations]>0;
        $addChoice[No nations found;null]
      ]
      
      $arrayForEach[nations;nat;
        $addChoice[#$env[nat]: $getNationInfo[$env[nat];name];$env[nat]]]
    ]
  ]
  `
});