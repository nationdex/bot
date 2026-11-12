import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'auctionStats',
  // Updates a user's "auction" stats and "userStats" after an auction event (listed, sold, unsold, won).
  params: [
    {
      name: 'user',
      type: 'String',
      required: true,
    },
    {
      name: 'aid',
      type: 'String',
      required: true,
    },
    {
      name: 'event',
      type: 'String',
      required: true,
    },
    {
      name: 'amount',
      type: 'String',
      required: false,
    },
  ],
  code: `
  $let[user;$env[user]]
  $let[lock;$mutex[acquire;user:$get[user]]]
  $jsonLoad[stats;$default[$getUserVar[auction;$get[user]];{}]]
  $jsonLoad[onSale;$default[$env[stats;onSale];[\\]]]
  $arrayFilter[onSale;listed;$env[listed]!=$env[aid];onSale]
  $!jsonSet[stats;total;$default[$env[stats;total];0]]
  $!jsonSet[stats;sold;$default[$env[stats;sold];0]]
  $!jsonSet[stats;earnings;$default[$env[stats;earnings];0]]
  $if[$env[event]==listed;
    $!arrayPush[onSale;$env[aid]]
    $!jsonSet[stats;total;$sum[$env[stats;total];1]]
  ]
  $if[$env[event]==sold;
    $!jsonSet[stats;sold;$sum[$env[stats;sold];1]]
    $!jsonSet[stats;earnings;$sum[$env[stats;earnings];$default[$replace[$env[amount];null;];0]]]
  ]
  $!jsonSet[stats;onSale;$env[onSale]]
  $setUserVar[auction;$env[stats];$get[user]]

  $if[$or[$env[event]==sold;$env[event]==won];
    $jsonLoad[us;$getUserVar[userStats;$get[user]]]
    $!jsonSet[us;trades_completed;$sum[$default[$env[us;trades_completed];0];1]]
    $setUserVar[userStats;$env[us];$get[user]]
  ]
  $!mutex[release;user:$get[user];$get[lock]]
  `,
});
