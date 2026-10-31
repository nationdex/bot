import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'accessOwners',
  // Returns the ids of every user holding an active owner level grant, as a JSON array.
  params: [
  ],
  code: `
  $jsonLoad[rows;$searchDB[userAccess]]
  $jsonLoad[acc;$accessData]
  $jsonLoad[roles;$if[$jsonHas[acc;roles];$env[acc;roles];{}]]
  $arrayCreate[owners]
  $let[now;$getTimestamp]
  $if[$isArray[rows];
    $arrayForEach[rows;r;
      $jsonLoad[ua;$env[r;value]]
      $jsonLoad[grants;$if[$jsonHas[ua;grants];$env[ua;grants];{}]]
      $if[$isArray[grants];
        $let[isOwner;$arraySome[grants;g;
          $let[exp;$if[$env[g;expires]!=null;$env[g;expires];0]]
          $and[
            $or[$get[exp]==0;$get[exp]>$get[now]];
            $or[
              $and[$env[g;kind]==role;$jsonHas[roles;$env[g;subject]];$arrayIncludes[$env[roles;$env[g;subject]];*]];
              $and[$env[g;kind]!=role;$env[g;subject]==*]
            ]
          ]
        ]]
        $if[$get[isOwner];$!arrayPush[owners;$env[r;id]]]
      ]
    ]
  ]
  $return[$jsonStringify[$env[owners]]]
  `,
});
