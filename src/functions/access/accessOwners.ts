import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'accessOwners',
  // Returns the ids of every user holding an active owner level grant, as a JSON array.
  params: [
  ],
  code: `
  $jsonLoad[rows;$searchDB[userAccess]]
  $arrayCreate[owners]
  $!arrayPush[owners;$botOwnerID]
  $arrayForEach[rows;r;
    $jsonLoad[held;$accessCaps[$env[r;id]]]
    $if[$arrayIncludes[held;*];$!arrayPush[owners;$env[r;id]]]
  ]
  $return[$jsonStringify[owners]]
  `,
});
