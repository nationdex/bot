import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'auctionSettle',
  // Settles every expired auction and notifies the parties. Safe to call anywhere, returns the settled count.
  params: [],
  code: `
  $jsonLoad[house;$default[$getGlobalVar[auctionHouse];{}]]
  $jsonLoad[listed;$default[$env[house;auctions];{}]]
  $jsonLoad[expired;$jsonKeys[listed]]
  $let[settled;0]
  $arrayForEach[expired;aid;
    $let[token;$auctionLock[acquire]]
    $if[$get[token]!=;
      $jsonLoad[chk;$default[$getGlobalVar[auctionHouse];{}]]
      $let[ends;$env[chk;auctions;$env[aid];ends]]
      $let[res;]
      $if[$and[$get[ends]!=;$get[ends]<=$getTimestamp];
        $let[res;$auctionClose[$env[aid];expired]]
      ]
      $!auctionLock[release;$get[token]]
      $if[$get[res]!=;
        $let[settled;$sum[$get[settled];1]]
        $!auctionNotify[$get[res]]
      ]
    ]
  ]
  $return[$get[settled]]
  `,
});
