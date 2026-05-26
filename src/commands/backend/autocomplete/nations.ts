import { BaseCommand } from '@tryforge/forgescript';

export default new BaseCommand({
  type: 'interactionCreate',
  allowedInteractionTypes: ['autocomplete'],
  code: `
  $onlyIf[$and[$applicationCommandName==nations;$focusedOptionName==nation]]
  
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
<<<<<<< HEAD
        $addChoice[#$env[nat]: $getEvent[$getNation[$get[id];event];emoji]$getNationInfo[$get[nation];name] | ($getNation[$env[nat];attack] $getNation[$env[nat];health]) | $parseDate[$getNation[$env[nat];timestamp];Locale];$env[nat]]]
    ]
  ]
  `,
});
=======
        $addChoice[#$env[nat]: $getSpecial[$getNation[$get[id];special];emoji]$getNationInfo[$get[nation];name] | ($getNation[$env[nat];attack] $getNation[$env[nat];health]) | $parseDate[$getNation[$env[nat];timestamp];Locale];$env[nat]]]
  `
});
>>>>>>> a1cd9b1 (added new nations commands, fixed minor bugs changed the DB format a little bit)
