import { BaseCommand } from '@tryforge/forgescript';

export default new BaseCommand({
  type: 'interactionCreate',
  allowedInteractionTypes: ['autocomplete'],
  code: `
  $onlyIf[$applicationCommandName==nations]
  
  $ifx[
    $if[$and[$applicationSubCommandName==info;$focusedOptionName==nation];
      $jsonLoad[nations;$getUserData[$authorID;nations]]
      $let[val;$toLowerCase[$focusedOptionValue]]
      $if[$get[val]!=;
        $arrayMap[nations;nat;
          $let[nation;$getNation[$env[nat];nation]]
          $jsonLoad[trs;$getNationInfo[$get[nation];translations]]
          $jsonLoad[cns;$getNationInfo[$get[nation];catching_names]]
          $if[$or[$checkContains[$toLowerCase[$getNationInfo[$get[nation];name]];$get[val]];$checkContains[$toLowerCase[$getNationInfo[$get[nation];short_name]];$get[val]];$arrayIncludes[trs;$get[val]];$arrayIncludes[cns;$get[val]]];
            $return[$env[nat]]
          ]
        ;nations]
      ]
      $arraySlice[nations;nations;0;25]
      
      $onlyIf[$arrayLength[nations]>0;
        $addChoice[You don't have any nation;null]
      ]
      
      $arrayForEach[nations;nat;
        $let[nation;$getNation[$env[nat];nation]]
        $addChoice[#$env[nat]: $getEvent[$getNation[$get[id];event];emoji]$getNationInfo[$get[nation];name] | ($getNation[$env[nat];attack] $getNation[$env[nat];health]) | $parseDate[$getNation[$env[nat];timestamp];Locale];$env[nat]]]
    ]
  ]
  `,
});
