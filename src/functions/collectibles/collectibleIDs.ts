import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'collectibleIDs',
  params: [
    {
      name: 'user',
      // User whose collectibles to get IDs for
      type: 'String',
      required: false
    },
    {
      name: 'class',
      // The rarity class of the collectibles to get IDs for
      type: 'String',
      required: false
    }
  ],
  brackets: false,
  code: `
  $let[user;$findUser[$env[user]]]
  $let[classExists;$isValidClass[$env[class]]]

  $if[$userExists[$get[user]];
    $jsonLoad[data;$getUserVar[userCollectibles;$get[user]]]
    $jsonLoad[ids;$env[data;unique]]
    $jsonLoad[ids;$js[
      (() => {
        const raw = ctx.getEnvironmentKey('ids')
        const list = Array.isArray(raw) ? raw : new Array()
        const norm = list.map((x) => (Number.isInteger(Number(x)) && String(Number(x)) === String(x) ? Number(x) : String(x)))
        return JSON.stringify(Array.from(new Set(norm)))
      })()
    ]]
  ;
    $jsonLoad[allCollectibles;$collectiblesData[collectibles]]
    $jsonLoad[ids;$jsonKeys[allCollectibles]]
  ]

  $if[$get[classExists];
    $arrayMap[ids;id;$if[$collectibleInfo[$env[id];class]==$env[class];$return[$env[id]]];ids]
  ]

  $if[$isJSON[$env[ids]]==false;
    $jsonLoad[ids;[\\]]
  ]

  $return[$env[ids]]
  `
});
