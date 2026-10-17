import { ForgeFunction } from '@tryforge/forgescript';
import { auctionConfig } from '../config/auction';

export default new ForgeFunction({
  name: 'auctionClose',
  // Settles one auction (caller must hold $auctionLock). reason: expired, buyout, cancel, admin. Returns a JSON summary.
  params: [
    {
      name: 'aid',
      type: 'String',
      required: true,
    },
    {
      name: 'reason',
      type: 'String',
      required: true,
    },
  ],
  code: `
  $let[aid;$env[aid]]
  $let[reason;$env[reason]]
  $jsonLoad[house;$default[$getGlobalVar[auctionHouse];{}]]
  $let[raw;$env[house;auctions;$get[aid]]]
  $if[$get[raw]==;$return[{}]]
  $jsonLoad[a;$get[raw]]

  $let[seller;$env[a;seller]]
  $let[bidder;$env[a;bidder]]
  $let[bid;$default[$env[a;bid];0]]
  $let[nat;$env[a;nation]]
  $let[sold;$and[$get[bidder]!=;$or[$get[reason]==expired;$get[reason]==buyout]]]
  $let[fee;0]
  $let[net;0]

  $ifx[
    $if[$get[sold];
      $let[fee;$floor[$divide[$multi[$get[bid];${auctionConfig.feePercent}];100]]]
      $let[net;$sub[$get[bid];$get[fee]]]
      $!auctionGrant[$get[bidder];$get[nat]]
      $editBalance[$get[seller];add;$get[net]]
      $!auctionStats[$get[seller];$get[aid];sold;$get[net]]
      $!auctionStats[$get[bidder];$get[aid];won]
    ]
    $else[
      $!auctionGrant[$get[seller];$get[nat]]
      $if[$get[bidder]!=;
        $editBalance[$get[bidder];add;$get[bid]]
      ]
      $!auctionStats[$get[seller];$get[aid];unsold]
    ]
  ]

  $!jsonDelete[house;auctions;$get[aid]]
  $setGlobalVar[auctionHouse;$env[house]]

  $return[{"id":"$get[aid]","reason":"$get[reason]","outcome":"$if[$get[sold];sold;returned]","seller":"$get[seller]","bidder":"$get[bidder]","bid":$get[bid],"fee":$get[fee],"net":$get[net],"nation":"$get[nat]","colID":"$env[a;colID]"}]
  `,
});
