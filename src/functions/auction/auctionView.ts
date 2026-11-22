import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'auctionView',
  // Components v2 detail card. mode=public is the shared announcement card, mode=panel is the viewer-aware ephemeral browse detail.
  params: [
    {
      name: 'aid',
      type: 'String',
      required: true,
    },
    {
      name: 'viewer',
      type: 'String',
      required: false,
    },
    {
      name: 'mode',
      type: 'String',
      required: false,
    },
    {
      name: 'filter',
      type: 'String',
      required: false,
    },
    {
      name: 'page',
      type: 'String',
      required: false,
    },
  ],
  code: `
  $let[aid;$env[aid]]
  $let[viewer;$replace[$env[viewer];null;]]
  $let[panel;$if[$env[mode]==panel;true;false]]
  $let[filter;$if[$or[$env[filter]==mine;$env[filter]==bidding];$env[filter];all]]
  $let[page;$if[$and[$isNumber[$env[page]];$env[page]>0];$env[page];1]]
  $let[owner;$if[$and[$get[panel];$get[viewer]!=];$get[viewer];0]]
  $let[mode;$if[$get[panel];panel;public]]
  $let[ctxId;$get[mode]-$get[owner]-$get[filter]-$get[page]]
  $jsonLoad[house;$default[$getGlobalVar[auctionHouse];{}]]
  $let[raw;$env[house;auctions;$get[aid]]]
  $if[$get[raw]==;
    $addContainer[
      $addTextDisplay[## Auction #$get[aid]
- This auction was not found or has already ended.]
      $if[$get[panel];
        $addSeparator
        $addActionRow
        $addButton[auction-page-$get[owner]-$get[filter]-$get[page];Back;Secondary]
      ]
    ;#FF0000]
    $return
  ]
  $jsonLoad[a;$get[raw]]
  $let[colID;$env[a;colID]]
  $let[nat;$env[a;nation]]
  $let[seller;$env[a;seller]]
  $let[bidder;$env[a;bidder]]
  $let[cur;$default[$env[a;bid];0]]
  $let[buyout;$default[$env[a;buyout];0]]
  $let[min;$if[$get[bidder]==;$env[a;start];$sum[$get[cur];$max[1;$ceil[$divide[$multi[$get[cur];$jsonVar[config;auction.minIncrementPercent;5]];100]]]]]]
  $if[$and[$get[buyout]>0;$get[min]>$get[buyout]];$let[min;$get[buyout]]]
  $let[ended;$if[$env[a;ends]<=$getTimestamp;true;false]]
  $let[endsSec;$floor[$divide[$env[a;ends];1000]]]
  $let[curName;$jsonVar[keywords;currency.plural]]
  $let[sellerName;$if[$userSettings[$get[seller];profile_privacy]==private;*Anonymous*;\`$fetchUsername[$get[seller]]\`]]
  $let[bidderName;$if[$get[bidder]==;;$if[$userSettings[$get[bidder];profile_privacy]==private;*Anonymous*;\`$fetchUsername[$get[bidder]]\`]]]
  $let[isSeller;$and[$get[panel];$get[viewer]==$get[seller]]]
  $let[isLeading;$and[$get[panel];$get[bidder]!=;$get[viewer]==$get[bidder]]]
  $let[lockBids;$or[$get[ended]==true;$get[isSeller];$get[isLeading]]]
  $let[canCancel;$and[$get[isSeller];$get[bidder]==;$get[ended]==false]]
  $let[isStaff;$if[$get[panel];$hasCap[$get[viewer];auction.moderate];false]]

  $addContainer[
    $addTextDisplay[## Auction #$get[aid]
$getSpecial[$collectible[$get[nat];special];emoji]$appEmoji[$collectibleInfo[$get[colID];emoji_id]] **$collectibleInfo[$get[colID];name]** \`#$get[nat]\`
-# ATK: **$collectible[$get[nat];attack]** ($collectible[$get[nat];attack_type]) / HP: **$collectible[$get[nat];health]** ($collectible[$get[nat];health_type])]
    $addSeparator
    $addTextDisplay[- **Seller:** $get[sellerName]
$if[$get[bidder]==;- **Starting bid:** $separateNumber[$env[a;start]] $get[curName];- **Current bid:** $separateNumber[$get[cur]] $get[curName] by **$get[bidderName]**]
- **Minimum next bid:** $separateNumber[$get[min]] $get[curName]
- **Buyout:** $if[$get[buyout]>0;$separateNumber[$get[buyout]] $get[curName];None]
- **Bids:** $default[$env[a;bids];0]
- **Ends:** <t:$get[endsSec]:R> (<t:$get[endsSec]:f>)]
    $addSeparator
    $addActionRow
    $addButton[auction-bid-$get[aid]-$get[min]-$get[ctxId];Bid $separateNumber[$get[min]];Primary;;$get[lockBids]]
    $if[$get[buyout]>0;
      $addButton[auction-buyout-$get[aid]-$get[buyout]-$get[ctxId];Buy now ($separateNumber[$get[buyout]]);Success;;$get[lockBids]]
    ]
    $addButton[auction-custom-$get[aid]-$get[min]-$get[ctxId];Custom bid;Secondary;;$get[lockBids]]
    $addButton[auction-refresh-$get[aid]-0-$get[ctxId];Refresh;Secondary]
    $if[$get[panel];
      $addButton[auction-page-$get[owner]-$get[filter]-$get[page];Back;Secondary]
    ]
    $if[$or[$get[canCancel];$get[isStaff]];
      $addActionRow
      $if[$get[canCancel];
        $addButton[auction-cancel-$get[aid]-0-$get[ctxId];Cancel listing;Danger]
      ]
      $if[$get[isStaff];
        $addButton[auction-force-$get[aid]-0-$get[ctxId];Force cancel;Danger]
      ]
    ]
  ;$jsonVar[config;accent]]
  `,
});
