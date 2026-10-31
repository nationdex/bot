import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'catalogRepair',
  // Startup repair: older versions counted catches under a stray userCollectibles key of the catalog. Moves those counts onto the nations and removes the key. Returns repaired or nothing.
  params: [],
  code: `
  $let[lock;$mutex[acquire;catalog]]
  $jsonLoad[catalog;$getGlobalVar[collectiblesData]]
  $let[repaired;no]
  $if[$jsonHas[catalog;userCollectibles];
    $jsonLoad[stray;$env[catalog;userCollectibles]]
    $jsonLoad[strayKeys;$jsonKeys[stray]]
    $jsonLoad[collectibles;$env[catalog;collectibles]]
    $arrayForEach[strayKeys;id;
      $let[caught;$if[$env[stray;$env[id];global_caught]!=null;$env[stray;$env[id];global_caught];0]]
      $if[$jsonHas[collectibles;$env[id]];
        $let[curCaught;$if[$env[collectibles;$env[id];global_caught]!=null;$env[collectibles;$env[id];global_caught];0]]
        $if[$get[caught]>$get[curCaught];
          $!jsonSet[collectibles;$env[id];global_caught;$get[caught]]
        ]
      ]
    ]
    $!jsonSet[catalog;collectibles;$env[collectibles]]
    $!jsonDelete[catalog;userCollectibles]
    $setGlobalVar[collectiblesData;$env[catalog]]
    $let[repaired;repaired]
  ]
  $!mutex[release;catalog;$get[lock]]
  $return[$if[$get[repaired]==repaired;repaired;]]
  `,
});
