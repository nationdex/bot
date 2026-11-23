import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'collectiblePrice',
  // Calculates the sell price of a collectible based on rarity weight, stats, and specials
  params: [
    {
      name: 'id',
      // The catch instance ID or catalog ID
      type: 'String',
      required: true,
    },
  ],
  code: `
  $let[input;$env[id]]
  $let[rawCatID;$replace[$collectible[$get[input];id];null;]]
  $let[catID;$default[$get[rawCatID];$get[input]]]

  $let[rawPrice;$replace[$collectibleInfo[$get[catID];sell_price];null;]]
  $if[$and[$isNumber[$get[rawPrice]];$get[rawPrice]>0];
    $return[$get[rawPrice]]
  ]

  $let[rawRarity;$replace[$collectibleInfo[$get[catID];rarity];null;]]
  $let[rarity;$default[$get[rawRarity];1]]
  $if[$or[$isNumber[$get[rarity]]==false;$get[rarity]<=0];
    $let[rarity;1]
  ]

  $let[rawAtk;$replace[$collectible[$get[input];attack];null;]]
  $let[atk;$default[$get[rawAtk];$collectibleInfo[$get[catID];attack]]]

  $let[rawHp;$replace[$collectible[$get[input];health];null;]]
  $let[hp;$default[$get[rawHp];$collectibleInfo[$get[catID];health]]]

  $if[$isNumber[$get[atk]]==false;$let[atk;0]]
  $if[$isNumber[$get[hp]]==false;$let[hp;0]]

  $let[base;$round[$divide[10;$get[rarity]]]]
  $let[statBonus;$round[$divide[$sum[$get[atk];$get[hp]];20]]]
  $let[total;$sum[$get[base];$get[statBonus]]]

  $let[spec;$replace[$collectible[$get[input];special];null;]]
  $if[$get[spec]!=;
    $let[total;$multi[$get[total];2]]
  ]

  $return[$max[$get[total];1]]
  `,
});
