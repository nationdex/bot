import { command } from '../../../core/commands';

export default command('autocomplete.access', `
  $onlyIf[$and[$applicationCommandName==access;$or[$applicationSubCommandName==role;$applicationSubCommandName==roledelete]]]
  $onlyIf[$hasCap[$authorID;access.manage;home]]
  $let[typed;$replace[$toLowerCase[$focusedOptionValue]; ;]]
  $jsonLoad[acc;$accessData]
  $jsonLoad[roleMap;$env[acc;roles]]

  $ifx[
    $if[$focusedOptionName==name;
      $jsonLoad[names;$jsonKeys[roleMap]]
      $arrayFilter[names;n;$and[$env[n]!=owner;$checkContains[$env[n];$get[typed]]];names]
      $arraySlice[names;names;0;24]
      $if[$and[$applicationSubCommandName==role;$get[typed]!=;$jsonHas[roleMap;$get[typed]]==false];
        $addChoice[New role: $cropText[$get[typed];0;80;...];$get[typed]]
      ]
      $arrayForEach[names;n;
        $jsonLoad[roleCaps;$env[roleMap;$env[n]]]
        $addChoice[$cropText[$env[n]: $arrayJoin[roleCaps;, ];0;100;...];$env[n]]
      ]
    ]

    $elseIf[$and[$focusedOptionName==capabilities;$applicationSubCommandName==role];
      $let[held;$accessCaps[$authorID]]
      $arrayCreate[parts]
      $if[$get[typed]!=;$arrayLoad[parts;,;$get[typed]]]
      $let[last;$if[$get[typed]==;;$arrayPop[parts]]]
      $let[prefix;$if[$arrayLength[parts]>0;$arrayJoin[parts;,],;]]
      $jsonLoad[caps;$accessCapabilityList]
      $arrayFilter[caps;c;$and[$checkContains[$env[c];$get[last]];$arrayIncludes[parts;$env[c]]==false;$accessCheck[$get[held];["$env[c]"\\]]==ok];caps]
      $arraySlice[caps;caps;0;24]
      $let[roleName;$toLowerCase[$trim[$option[name]]]]
      $if[$and[$get[typed]==;$get[roleName]!=;$jsonHas[roleMap;$get[roleName]]];
        $jsonLoad[roleCaps;$env[roleMap;$get[roleName]]]
        $let[current;$arrayJoin[roleCaps;,]]
        $if[$cropText[$get[current];0;100;]==$get[current];
          $addChoice[Current: $cropText[$get[current];0;85;...];$get[current]]
        ]
      ]
      $arrayForEach[caps;c;
        $let[value;$get[prefix]$env[c]]
        $if[$cropText[$get[value];0;100;]==$get[value];
          $addChoice[$get[value];$get[value]]
        ]
      ]
    ]
  ]
`);
