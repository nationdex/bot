import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'randomRarity',
  // Returns a random ID from the given JSON based on its "rarity" key value.
  params: [
    {
      name: 'data',
      // The JSON data of values. Must be in the following form: { "id": { "rarity": integer } }
      type: 'String',
      required: true,
    },
  ],
  code: `
  $if[$isJSON[$env[data]]==false;$return[$env[data]]]
  $jsonLoad[pool;$env[data]]
  $if[$isArray[$env[pool]];$return[]]
  $jsonLoad[ids;$jsonKeys[pool]]
  $let[total;0]
  $arrayForEach[ids;id;
    $let[total;$math[$get[total]+$default[$env[pool;$env[id];rarity];0]]]
  ]
  $if[$get[total]<=0;$return[]]
  $let[roll;$randomNumber[0;$get[total];true]]
  $let[acc;0]
  $let[pick;]
  $arrayForEach[ids;id;
    $let[acc;$math[$get[acc]+$default[$env[pool;$env[id];rarity];0]]]
    $if[$and[$get[pick]==;$get[acc]>$get[roll]];$let[pick;$env[id]]]
  ]
  $return[$default[$get[pick];$arrayAt[ids;-1]]]
  `,
});
