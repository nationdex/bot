import { BaseCommand } from '@tryforge/forgescript';
import { ctbl } from '../../../config/collectible';

export default new BaseCommand({
  type: 'interactionCreate',
  allowedInteractionTypes: ['autocomplete'],
  code: `
  $onlyIf[$applicationCommandName==rarity]
  
  $ifx[
    $if[$and[$applicationSubCommandName==info;$focusedOptionName==${ctbl.singular}];
      $jsonLoad[ctbls;$collectiblesData[id]]
      $let[val;$replace[$toLowerCase[$focusedOptionValue];#;]]
      $if[$get[val]!=;
        $arrayMap[ctbls;nat;
          $jsonLoad[trs;$collectibleInfo[$env[nat];translations]]
          $jsonLoad[cns;$collectibleInfo[$env[nat];catching_names]]
          $if[$or[$checkContains[$toLowerCase[$env[nat]];$get[val]];$checkContains[$toLowerCase[$collectibleInfo[$env[nat];name]];$get[val]];$checkContains[$toLowerCase[$collectibleInfo[$env[nat];short_name]];$get[val]];$arrayIncludes[trs;$get[val]];$arrayIncludes[cns;$get[val]]];
            $return[$env[nat]]
          ]
        ;ctbls]
      ]
      $arraySlice[ctbls;ctbls;0;25]
      
      $onlyIf[$arrayLength[ctbls]>0;
        $addChoice[No ${ctbl.plural} found;null]
      ]
      
      $arrayForEach[ctbls;nat;
        $addChoice[#$env[nat]: $collectibleInfo[$env[nat];name];$env[nat]]]
    ]
  ]
  `,
});
