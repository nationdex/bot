import { command } from '../../core/define/commands';

export default command('autocomplete.access', `
  $onlyIf[$and[$applicationCommandName==access;$or[$applicationSubCommandName==role;$applicationSubCommandName==roledelete;$applicationSubCommandName==grant;$applicationSubCommandName==revoke]]]
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

    $elseIf[$focusedOptionName==access;
      $let[held;$accessCaps[$authorID]]
      $let[target;$replace[$option[user];null;]]
      $if[$and[$applicationSubCommandName==revoke;$get[target]!=];
        $jsonLoad[ua;$default[$getUserVar[userAccess;$get[target]];{}]]
        $jsonLoad[grants;$default[$env[ua;grants];[\\]]]
        $arrayMap[grants;g;$return[$env[g;subject]];subjects]
        $arrayUnique[subjects;subjects]
        $arrayFilter[subjects;sub;$checkContains[$env[sub];$get[typed]];subjects]
        $arraySlice[subjects;subjects;0;25]
        $arrayForEach[subjects;sub;$addChoice[$env[sub];$env[sub]]]
      ;
        $jsonLoad[names;$jsonKeys[roleMap]]
        $arrayFilter[names;n;$and[$checkContains[$env[n];$get[typed]];$accessCheck[$get[held];$env[roleMap;$env[n]]]==ok];names]
        $arraySlice[names;names;0;12]
        $arrayForEach[names;n;
          $jsonLoad[roleCaps;$env[roleMap;$env[n]]]
          $addChoice[$cropText[Role $env[n]: $arrayJoin[roleCaps;, ];0;100;...];$env[n]]
        ]
        $jsonLoad[caps;$accessCapabilityList]
        $arrayFilter[caps;c;$and[$checkContains[$env[c];$get[typed]];$accessCheck[$get[held];["$env[c]"\\]]==ok];caps]
        $arraySlice[caps;caps;0;$sub[25;$arrayLength[names]]]
        $arrayForEach[caps;c;$addChoice[$env[c];$env[c]]]
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
