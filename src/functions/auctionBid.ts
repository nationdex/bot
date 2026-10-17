import { ForgeFunction } from '@tryforge/forgescript';
import { auctionConfig } from '../config/auction';

export default new ForgeFunction({
  name: 'auctionBid',
  // Places a bid atomically: escrows the bidder's currency, refunds the previous bidder, handles buyout and anti-snipe. Returns JSON.
  params: [
    {
      name: 'aid',
      type: 'String',
      required: true,
    },
    {
      name: 'user',
      type: 'String',
      required: true,
    },
    {
      name: 'amount',
      type: 'String',
      required: true,
    },
  ],
  code: `
  $let[aid;$env[aid]]
  $let[user;$env[user]]
  $let[amount;$round[$env[amount]]]
  $let[token;$auctionLock[acquire]]
  $if[$get[token]==;$return[{"status":"busy"}]]

  $jsonLoad[house;$default[$getGlobalVar[auctionHouse];{}]]
  $let[raw;$env[house;auctions;$get[aid]]]
  $jsonLoad[a;$default[$get[raw];{}]]
  $let[now;$getTimestamp]
  $let[cur;$default[$env[a;bid];0]]
  $let[prev;$env[a;bidder]]
  $let[buyout;$default[$env[a;buyout];0]]
  $let[min;$if[$get[prev]==;$default[$env[a;start];1];$sum[$get[cur];$max[1;$ceil[$divide[$multi[$get[cur];${auctionConfig.minIncrementPercent}];100]]]]]]
  $let[isBuyout;$and[$get[buyout]>0;$get[amount]>=$get[buyout]]]
  $if[$get[isBuyout];$let[amount;$get[buyout]]]
  $let[bal;$default[$getUserVar[balance;$get[user]];0]]
  $let[closed;{}]
  $let[status;]

  $ifx[
    $if[$get[raw]==;$let[status;not_found]]
    $elseIf[$env[a;ends]<=$get[now];$let[status;ended]]
    $elseIf[$env[a;seller]==$get[user];$let[status;own]]
    $elseIf[$get[prev]==$get[user];$let[status;leading]]
    $elseIf[$get[amount]<1;$let[status;too_low]]
    $elseIf[$and[$get[isBuyout]==false;$get[amount]<$get[min]];$let[status;too_low]]
    $elseIf[$get[bal]<$get[amount];$let[status;low_bal]]
    $else[
      $editBalance[$get[user];remove;$get[amount]]
      $if[$get[prev]!=;
        $editBalance[$get[prev];add;$get[cur]]
      ]
      $!jsonSet[house;auctions;$get[aid];bid;$get[amount]]
      $!jsonSet[house;auctions;$get[aid];bidder;"$get[user]"]
      $!jsonSet[house;auctions;$get[aid];bids;$sum[$default[$env[a;bids];0];1]]
      $if[$sub[$env[a;ends];$get[now]]<${auctionConfig.antiSnipeMs};
        $!jsonSet[house;auctions;$get[aid];ends;$sum[$get[now];${auctionConfig.antiSnipeMs}]]
      ]
      $setGlobalVar[auctionHouse;$env[house]]
      $if[$get[isBuyout];
        $let[closed;$auctionClose[$get[aid];buyout]]
        $let[status;buyout]
      ;
        $let[status;ok]
      ]
    ]
  ]

  $!auctionLock[release;$get[token]]
  $return[{"status":"$get[status]","aid":"$get[aid]","amount":$get[amount],"min":$get[min],"previous":"$get[prev]","refund":$get[cur],"buyout":$get[buyout],"ends":$default[$env[house;auctions;$get[aid];ends];0],"colID":"$env[a;colID]","nation":"$env[a;nation]","seller":"$env[a;seller]","closed":$get[closed]}]
  `,
});
