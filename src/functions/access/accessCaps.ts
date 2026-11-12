import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'accessCaps',
  // Returns the active capabilities of a user as a JSON array: unexpired grants with roles expanded.
  params: [
    {
      name: 'user',
      // The user id
      type: 'String',
      required: true,
    },
  ],
  code: `
  $jsonLoad[ua;$getUserVar[userAccess;$env[user]]]
  $jsonLoad[acc;$accessData]
  $jsonLoad[roles;$if[$jsonHas[acc;roles];$env[acc;roles];{}]]
  $jsonLoad[grants;$if[$jsonHas[ua;grants];$env[ua;grants];{}]]
  $arrayCreate[outCaps]
  $let[now;$getTimestamp]
  $if[$isArray[$env[grants]];
    $arrayForEach[grants;g;
      $let[exp;$if[$env[g;expires]!=null;$env[g;expires];0]]
      $if[$or[$get[exp]==0;$get[exp]>$get[now]];
        $if[$env[g;kind]==role;
          $let[subj;$env[g;subject]]
          $jsonLoad[roleCaps;$if[$jsonHas[roles;$get[subj]];$env[roles;$get[subj]];{}]]
          $if[$isArray[$env[roleCaps]];
            $arrayForEach[roleCaps;c;
              $if[$arrayIncludes[outCaps;$env[c]]==false;$!arrayPush[outCaps;$env[c]]]
            ]
          ]
        ;
          $if[$arrayIncludes[outCaps;$env[g;subject]]==false;$!arrayPush[outCaps;$env[g;subject]]]
        ]
      ]
    ]
  ]
  $return[$jsonStringify[outCaps]]
  `,
});
